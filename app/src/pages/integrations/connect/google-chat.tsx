import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Box, Stack, Typography, CircularProgress } from '@mui/material';
import { Button as DsButton } from '@components1/ds/Button';
import apiIntegrations from '@api1/integrations';
import { withAuth, isTenantAdmin, getUserSession } from '@lib/auth';
import { colors } from 'src/utils/colors';

type Status = 'idle' | 'connecting' | 'success' | 'already_bound' | 'error';

const SPACE_ID_PATTERN = /^spaces\/[A-Za-z0-9_-]+$/;

function ConnectGoogleChatSpace() {
  const router = useRouter();
  const spaceId = typeof router.query.space_id === 'string' ? router.query.space_id : '';
  const displayName = typeof router.query.display_name === 'string' ? router.query.display_name : '';

  const session = getUserSession();
  const tenantName: string = session?.tenant?.name || 'your Nudgebee organization';

  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const spaceIdValid = useMemo(() => SPACE_ID_PATTERN.test(spaceId), [spaceId]);
  const userIsTenantAdmin = isTenantAdmin();

  const handleConnect = async () => {
    setStatus('connecting');
    setErrorMessage('');

    const payload = {
      integration_name: 'google_chat_space',
      integration_config_name: spaceId,
      integration_config_values: [
        { name: 'display_name', value: displayName },
        { name: 'space_type', value: 'SPACE' },
      ],
      account_ids: [] as string[],
      source: 'user',
      skip_validation: true,
    };

    try {
      const response: any = await apiIntegrations.addIntegrations(payload);
      // GraphQL errors normally arrive under response.data.errors (axios wraps
      // the HTTP body in .data); also check the top-level response.errors and
      // response.message for the case where addIntegrations returns a thrown error.
      const gqlError = response?.errors?.[0]?.message || response?.data?.errors?.[0]?.message || response?.message || '';
      if (gqlError) {
        // Surface heuristic: both the in-tx FOR UPDATE name check and the
        // partial unique index collapse to an "already exists" message on
        // collision (the index raises Postgres 23505, which the create handler
        // translates to the same string), so the substring check covers both.
        if (gqlError.toLowerCase().includes('already exists')) {
          setStatus('already_bound');
        } else {
          setStatus('error');
          setErrorMessage(gqlError);
        }
        return;
      }
      if (response?.data?.data?.integrations_create_config?.id) {
        setStatus('success');
        return;
      }
      setStatus('error');
      setErrorMessage('Unexpected response from server.');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Failed to connect this space.');
    }
  };

  const renderBody = () => {
    if (!spaceIdValid) {
      return (
        <Typography variant='body1'>
          This link is malformed. Please return to your Google Chat space and click the Connect button on the bot&apos;s card again.
        </Typography>
      );
    }
    if (!userIsTenantAdmin) {
      return <Typography variant='body1'>Only a tenant admin can bind a Google Chat space. Ask your admin to open this link.</Typography>;
    }
    if (status === 'success') {
      return (
        <Typography variant='body1' data-testid='gchat-connect-success'>
          ✓ Connected. Return to your Google Chat space and retry your message — the bot now knows it belongs to <strong>{tenantName}</strong>.
        </Typography>
      );
    }
    if (status === 'already_bound') {
      return (
        <Typography variant='body1' data-testid='gchat-connect-already-bound'>
          This space is already bound to a Nudgebee organization. If you need to move it, ask your admin to unbind the existing binding first.
        </Typography>
      );
    }
    return (
      <Stack spacing={2}>
        <Typography variant='body1'>
          Connect Google Chat space <strong>{displayName || spaceId}</strong>
          {displayName ? (
            <span>
              {' '}
              (<code>{spaceId}</code>)
            </span>
          ) : null}{' '}
          to your <strong>{tenantName}</strong> org?
        </Typography>
        <Stack direction='row' spacing={2}>
          <DsButton data-testid='gchat-connect-submit' disabled={status === 'connecting'} onClick={handleConnect}>
            {status === 'connecting' ? <CircularProgress size={18} /> : 'Connect'}
          </DsButton>
        </Stack>
        {status === 'error' && errorMessage ? (
          <Typography variant='body2' sx={{ color: colors.errorText }}>
            {errorMessage}
          </Typography>
        ) : null}
      </Stack>
    );
  };

  return (
    <>
      <Head>
        <title>Connect Google Chat — Nudgebee</title>
      </Head>
      <Box sx={{ maxWidth: 640, mx: 'auto', mt: 8, p: 4 }}>
        <Typography variant='h5' sx={{ mb: 3 }}>
          Connect Google Chat
        </Typography>
        {renderBody()}
      </Box>
    </>
  );
}

export default withAuth(ConnectGoogleChatSpace);
