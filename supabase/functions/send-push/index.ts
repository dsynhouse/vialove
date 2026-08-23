// Supabase Edge Function: sends a Web Push notification to the *other*
// member of a bond whenever a Database Webhook fires on an INSERT to one of
// the tables below. See ../../README.md in this directory for setup.
//
// Deploy: supabase functions deploy send-push
// Secrets (supabase secrets set ...):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  — from `npx web-push generate-vapid-keys`
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY are provided automatically by Supabase.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

webpush.setVapidDetails('mailto:hello@vialove.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: Record<string, unknown>;
}

function messageFor(table: string, record: Record<string, unknown>, senderName: string): { title: string; body: string } {
  switch (table) {
    case 'check_ins':
      return { title: `${senderName} checked in`, body: (record.note as string) || "See how they're feeling today." };
    case 'journal_entries':
      return { title: `${senderName} wrote in the journal`, body: record.prompt as string };
    case 'vault_entries':
      return { title: `${senderName} shared something in the vault`, body: 'Take a look when you have a moment.' };
    case 'weekly_responses':
      return { title: `${senderName} submitted this week's pulse`, body: 'Submit yours to see both answers.' };
    case 'events':
      return { title: `${senderName} added a plan`, body: record.title as string };
    case 'mindful_logs':
      return { title: `${senderName} completed a mindful session`, body: 'A little steadiness goes a long way.' };
    case 'support_signals':
      return { title: `${senderName} could use extra care`, body: 'Sent quietly from the Village.' };
    case 'thinking_of_you_pings':
      return { title: `${senderName} is thinking of you`, body: '💗' };
    default:
      return { title: 'vialove', body: `${senderName} did something new in your bond.` };
  }
}

function senderIdOf(record: Record<string, unknown>): string | undefined {
  return (record.person_id ?? record.author_id ?? record.created_by) as string | undefined;
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();
  const senderId = senderIdOf(payload.record);
  const bondId = payload.record.bond_id as string | undefined;
  if (!senderId || !bondId) return new Response('missing sender/bond', { status: 200 });

  const { data: members } = await supabase.from('bond_members').select('user_id').eq('bond_id', bondId);
  const recipientId = members?.find((m) => m.user_id !== senderId)?.user_id;
  if (!recipientId) return new Response('no recipient (partner has not joined yet)', { status: 200 });

  const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', recipientId);
  if (!subs || subs.length === 0) return new Response('recipient has no push subscriptions', { status: 200 });

  const { data: sender } = await supabase.from('profiles').select('name').eq('id', senderId).single();
  const { title, body } = messageFor(payload.table, payload.record, sender?.name ?? 'Your partner');

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          JSON.stringify({ title, body }),
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription expired or was revoked by the browser — clean it up.
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('push send failed', err);
        }
      }
    }),
  );

  return new Response('ok', { status: 200 });
});
