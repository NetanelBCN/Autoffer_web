package org.socialnetwork.messagingserver.models

data class TextMessageRequest(
    val chatId: String,
    val sender: String,
    val receiver: String,
    val content: String,
    val timestamp: String
)
