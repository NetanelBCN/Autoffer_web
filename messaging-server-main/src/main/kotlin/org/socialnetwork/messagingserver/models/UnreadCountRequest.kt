package org.socialnetwork.messagingserver.models

data class UnreadCountRequest(
    val chatId: String,
    val userId: String
)

