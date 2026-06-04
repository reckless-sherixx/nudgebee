import { useEffect, useState } from 'react';
import { Box, Stack, Typography, CircularProgress } from '@mui/material';
import apiAccount from '@api1/account';

/**
 * Google Chat integration panel (service-account model).
 *
 * Replaces the old user-OAuth "Add to Google Chat" install flow. Google Chat
 * now connects through the Nudgebee bot: an admin adds the bot to a space, the
 * bot posts a Connect card, and a tenant admin binds the space. This panel
 * explains that flow and lists the spaces already bound to the tenant (the
 * google_chat_space integrations returned by notifications_list_channels).
 */
export default function GoogleChatSpacesPanel() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiAccount.getNotificationChannelList('google_chat');
        // getNotificationChannelList wraps the action payload, so the bound-space
        // array lands at res.data.data ({ data: { data: [...] } }).
        const list = res?.data?.data ?? res?.data;
        if (active) {
          setSpaces(Array.isArray(list) ? list : []);
        }
      } catch (error) {
        console.error('Failed to fetch Google Chat spaces:', error);
        if (active) {
          setSpaces([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Box sx={{ maxWidth: 820 }} data-testid='gchat-spaces-panel'>
      <Typography variant='h6' sx={{ mb: 1 }}>
        Google Chat
      </Typography>
      <Typography variant='body2' sx={{ color: 'text.secondary', mb: 3 }}>
        Google Chat connects through the Nudgebee bot — no user sign-in required. Add the bot to a space, then a tenant admin binds that space to your
        organization. Bound spaces become available as notification-rule destinations.
      </Typography>

      <Box sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant='subtitle2' sx={{ mb: 1 }}>
          Connect a space
        </Typography>
        <Box component='ol' sx={{ m: 0, pl: 2.5, '& li': { mb: 0.5 } }}>
          <li>
            Open the Google Chat space and add the <strong>Nudgebee</strong> app.
          </li>
          <li>
            The bot posts a <strong>Connect to Nudgebee</strong> card in the space.
          </li>
          <li>
            A tenant admin clicks <strong>Connect</strong> to bind the space to this organization.
          </li>
        </Box>
      </Box>

      <Typography variant='subtitle2' sx={{ mb: 1 }}>
        Connected spaces
      </Typography>
      {loading ? (
        <CircularProgress size={20} />
      ) : spaces.length === 0 ? (
        <Typography variant='body2' sx={{ color: 'text.secondary' }} data-testid='gchat-no-spaces'>
          No spaces connected yet. Add the bot to a space to get started.
        </Typography>
      ) : (
        <Stack spacing={1} data-testid='gchat-spaces-list'>
          {spaces.map((space) => (
            <Box
              key={space.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant='body2'>{space.name || space.id}</Typography>
              <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                {space.id}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
