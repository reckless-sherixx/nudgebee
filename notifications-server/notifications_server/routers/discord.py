import logging
import uuid

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from notifications_server import sync_engine
from notifications_server.clients.discord_client import DiscordClient
from notifications_server.message_templates.base import render_success_page
from notifications_server.configs.settings import settings
from notifications_server.models.models import MessagingPlatform
from notifications_server.repositories.oauth_repository import find_installation_by_tenant_and_platform
from notifications_server.utils.datetime_utils import utc_now

LOG = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/integrations",
    tags=["discord"],
    responses={404: {"description": "Not found"}},
)


class DiscordInstallRequest(BaseModel):
    bot_token: str


@router.post("/install/discord")
async def discord_install(request: Request, body: DiscordInstallRequest):
    tenant_id = request.headers.get("tenant-id")
    user_email = request.headers.get("x-user-email")

    if not tenant_id:
        raise HTTPException(status_code=403, detail="Tenant id missing for installation")

    # Reject duplicates
    with Session(sync_engine) as session:
        installations = find_installation_by_tenant_and_platform(session, tenant_id, "discord")
    if len(installations) > 0:
        raise HTTPException(status_code=400, detail="Installation already exists for tenant")

    # Validate the bot token
    result = DiscordClient.validate_token(body.bot_token)
    if not result.get("ok"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Discord bot token: {result.get('error', 'Unknown error')}",
        )

    bot_info = result.get("bot", {})

    # Persist the installation
    installation = MessagingPlatform()
    installation.id = uuid.uuid4()
    installation.platform = "discord"
    installation.client_id = "discord_bot"
    installation.tenant_id = tenant_id
    installation.token = body.bot_token
    installation.username = user_email or bot_info.get("username", "discord_bot")
    installation.bot_id = bot_info.get("id")
    installation.created_at = utc_now()
    installation.updated_at = utc_now()

    with Session(sync_engine) as session:
        session.add(installation)
        session.commit()

    LOG.info("Discord installation saved for tenant %s (bot: %s)", tenant_id, bot_info.get("username"))
    return {"success": True, "bot_username": bot_info.get("username")}
