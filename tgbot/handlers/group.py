from aiogram import Router, F
from aiogram.types import Message, ChatMemberUpdated, ChatPermissions, ChatMemberAdministrator, ChatMemberRestricted
from aiogram.filters.chat_member_updated import ChatMemberUpdatedFilter, JOIN_TRANSITION, LEAVE_TRANSITION
from aiogram.enums import ChatMemberStatus
from infrastructure.database.models import Group
from infrastructure.database.repo.requests import RequestsRepo

group_router = Router()


def check_missing_permissions(bot_member: ChatMemberAdministrator) -> list[str]:
    """Check which permissions are missing for the bot"""
    missing_permissions = []
    if not bot_member.can_delete_messages:
        missing_permissions.append("Delete Messages")
    if not bot_member.can_restrict_members:
        missing_permissions.append("Restrict Members")
    if not bot_member.can_pin_messages:
        missing_permissions.append("Pin Messages")
    if not bot_member.can_invite_users:
        missing_permissions.append("Invite Users")
    if not bot_member.can_post_messages:
        missing_permissions.append("Send Messages")
    return missing_permissions


@group_router.my_chat_member()
async def bot_status_updated(message: ChatMemberUpdated, repo: RequestsRepo):
    """Handler for any bot status updates in the group"""
    if message.old_chat_member.status == message.new_chat_member.status:
        # Permissions were updated
        if isinstance(message.new_chat_member, ChatMemberAdministrator):
            missing_permissions = check_missing_permissions(message.new_chat_member)
            
            if not missing_permissions:
                await message.answer(
                    "✅ Thank you! All required permissions have been granted. "
                    "The bot is now fully functional!"
                )
            else:
                permissions_text = (
                    "⚠️ The bot still needs the following permissions:\n" +
                    "\n".join(f"• {perm}" for perm in missing_permissions) +
                    "\n\nPlease grant these permissions for full functionality."
                )
                await message.answer(permissions_text)
        
        return

    # Handle joining group
    if message.new_chat_member.status == ChatMemberStatus.MEMBER:
        chat = message.chat
        bot = message.bot
        
        try:
            # Check bot permissions
            bot_member = await bot.get_chat_member(chat.id, bot.id)
            # Check bot's permissions based on member type
            if isinstance(bot_member, ChatMemberAdministrator):
                missing_permissions = check_missing_permissions(bot_member)
            else:
                missing_permissions = ["Administrator status (required for full functionality)"]

            # Get chat members (only if bot has permission)
            try:
                members = await bot.get_chat_administrators(chat.id)
                admin_names = [
                    f"• {member.user.full_name}"
                    for member in members
                    if not member.user.is_bot
                ]
                admins_text = (
                    f"Group admins:\n"
                    f"{chr(10).join(admin_names)}\n\n"
                )
            except Exception:
                admins_text = ""

            # Save group to database
            await repo.groups.create_or_update_group(
                group_id=chat.id,
                title=chat.title,
                is_active=True
            )

            # Prepare greeting message
            if missing_permissions:
                permissions_text = (
                    "⚠️ The bot needs the following permissions to function properly:\n" +
                    "\n".join(f"• {perm}" for perm in missing_permissions) +
                    "\n\nPlease ask a group admin to grant these permissions."
                )
                greeting_text = (
                    f"👋 Hello! I've been added to the group {chat.title}!\n\n"
                    f"{admins_text}"
                    f"{permissions_text}"
                )
            else:
                greeting_text = (
                    f"👋 Hello! I've been added to the group {chat.title}!\n\n"
                    f"{admins_text}"
                    "✅ All required permissions are granted. The bot is ready to work!"
                )

            await message.answer(greeting_text)
            
        except Exception as e:
            error_text = f"Failed to initialize bot in the group: {str(e)}"
            await message.answer(
                "❌ An error occurred while setting up the bot. "
                "Please ensure the bot has all necessary permissions and try again."
            )
            print(error_text)

    # Handle leaving group
    elif message.new_chat_member.status == ChatMemberStatus.LEFT:
        try:
            await repo.groups.deactivate_group(message.chat.id)
            await message.answer("👋 Goodbye! I've been removed from the group")
        except Exception as e:
            error_text = f"Failed to update group status: {str(e)}"
            print(error_text)


# TODO: Implement this handler
async def answer_to_questionnaire(message: Message):
    """Handler for answering to questionnaire"""
    pass
