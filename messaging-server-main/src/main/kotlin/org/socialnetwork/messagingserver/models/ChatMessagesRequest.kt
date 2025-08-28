package org.socialnetwork.messagingserver.models

data class ChatMessagesRequest(
    val chatId: String,
    val page: Int = 0,
    val size: Int = 50
)