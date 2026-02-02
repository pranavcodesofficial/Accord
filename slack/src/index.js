require('dotenv').config();
const { App } = require('@slack/bolt');

// Initialize the Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Default workspace and user for Slack integration
// In production, map Slack workspace/user to Accord workspace/user via OAuth
const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || 'slack-workspace';
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'slack-user';

// Store JWT token (in production, use proper token management)
let authToken = null;

// Authenticate with backend
async function getAuthToken() {
  if (authToken) return authToken;
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: DEFAULT_WORKSPACE_ID,
        user_id: DEFAULT_USER_ID,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to authenticate with backend');
    }
    
    const data = await response.json();
    authToken = data.token;
    return authToken;
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
}

// Post decision to backend
async function createDecision(decisionData) {
  const token = await getAuthToken();
  
  const response = await fetch(`${BACKEND_URL}/api/decisions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(decisionData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to create decision');
  }
  
  return response.json();
}

// Listen for messages containing decision-related keywords
app.message(/decision|decided|go with|agreed to|we will|let's do/i, async ({ message, client, logger }) => {
  try {
    // Don't respond to bot messages
    if (message.subtype === 'bot_message') return;
    
    // Get the channel and message info
    const channelId = message.channel;
    const messageTs = message.ts;
    const userId = message.user;
    
    // Get the message permalink for source_link
    let permalink = '';
    try {
      const linkResult = await client.chat.getPermalink({
        channel: channelId,
        message_ts: messageTs,
      });
      permalink = linkResult.permalink;
    } catch (e) {
      logger.warn('Could not get permalink:', e);
    }

    // Send an ephemeral message with a button to log the decision
    await client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: "🎯 This looks like a decision! Would you like to log it?",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "🎯 *This looks like a decision!*\nWould you like to log it to Accord for your team?"
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `_"${message.text?.substring(0, 100)}${message.text?.length > 100 ? '...' : ''}"_`
            }
          ]
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "📝 Log Decision",
                emoji: true
              },
              style: "primary",
              action_id: "open_decision_modal",
              value: JSON.stringify({
                original_text: message.text,
                permalink: permalink,
                channel_id: channelId,
              })
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Dismiss",
                emoji: true
              },
              action_id: "dismiss_decision_prompt"
            }
          ]
        }
      ]
    });
    
  } catch (error) {
    logger.error('Error handling message:', error);
  }
});

// Handle button click to open modal
app.action('open_decision_modal', async ({ body, ack, client, logger }) => {
  await ack();
  
  try {
    const payload = JSON.parse(body.actions[0].value);
    
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "decision_submission",
        private_metadata: JSON.stringify({
          permalink: payload.permalink,
          channel_id: payload.channel_id,
        }),
        title: {
          type: "plain_text",
          text: "Log Decision"
        },
        submit: {
          type: "plain_text",
          text: "Save"
        },
        close: {
          type: "plain_text",
          text: "Cancel"
        },
        blocks: [
          {
            type: "input",
            block_id: "decision_text_block",
            label: {
              type: "plain_text",
              text: "Decision Summary"
            },
            element: {
              type: "plain_text_input",
              action_id: "decision_text",
              multiline: true,
              initial_value: payload.original_text || "",
              placeholder: {
                type: "plain_text",
                text: "What was decided?"
              }
            }
          },
          {
            type: "input",
            block_id: "rationale_block",
            optional: true,
            label: {
              type: "plain_text",
              text: "Rationale"
            },
            element: {
              type: "plain_text_input",
              action_id: "rationale",
              multiline: true,
              placeholder: {
                type: "plain_text",
                text: "Why was this decision made?"
              }
            }
          },
          {
            type: "input",
            block_id: "tags_block",
            optional: true,
            label: {
              type: "plain_text",
              text: "Tags"
            },
            element: {
              type: "plain_text_input",
              action_id: "tags",
              placeholder: {
                type: "plain_text",
                text: "e.g., engineering, product, design (comma-separated)"
              }
            }
          },
          {
            type: "input",
            block_id: "links_block",
            optional: true,
            label: {
              type: "plain_text",
              text: "Related Links"
            },
            element: {
              type: "plain_text_input",
              action_id: "links",
              placeholder: {
                type: "plain_text",
                text: "e.g., design doc, RFC, or discussion link"
              }
            }
          }
        ]
      }
    });
    
  } catch (error) {
    logger.error('Error opening modal:', error);
  }
});

// Handle dismiss button
app.action('dismiss_decision_prompt', async ({ ack }) => {
  await ack();
});

// Handle modal submission
app.view('decision_submission', async ({ ack, view, body, client, logger }) => {
  await ack();
  
  try {
    const values = view.state.values;
    const metadata = JSON.parse(view.private_metadata || '{}');
    
    const decisionText = values.decision_text_block.decision_text.value;
    const rationale = values.rationale_block?.rationale?.value || null;
    const links = values.links_block?.links?.value || metadata.permalink;
    
    // Create decision in backend
    await createDecision({
      decision_text: decisionText,
      rationale: rationale,
      source_platform: 'slack',
      source_link: links || metadata.permalink,
    });
    
    // Send confirmation message
    if (metadata.channel_id) {
      await client.chat.postEphemeral({
        channel: metadata.channel_id,
        user: body.user.id,
        text: "✅ Decision logged successfully!",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "✅ *Decision logged successfully!*\nYour team decision has been saved to Accord."
            }
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `_${decisionText.substring(0, 150)}${decisionText.length > 150 ? '...' : ''}_`
              }
            ]
          }
        ]
      });
    }
    
  } catch (error) {
    logger.error('Error submitting decision:', error);
    
    // Notify user of error
    try {
      const metadata = JSON.parse(view.private_metadata || '{}');
      if (metadata.channel_id) {
        await client.chat.postEphemeral({
          channel: metadata.channel_id,
          user: body.user.id,
          text: "❌ Failed to log decision. Please try again.",
        });
      }
    } catch (e) {
      logger.error('Could not send error message:', e);
    }
  }
});

// Start the app
(async () => {
  const port = process.env.PORT || 3002;
  await app.start(port);
  console.log(`⚡️ Accord Slack bot is running on port ${port}!`);
})();
