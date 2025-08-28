package org.socialnetwork.messagingserver.models

data class FileMessageRequest(
    val chatId: String,
    val sender: String,
    val receiver: String,
    val fileBytes: List<Byte>,
    val fileName: String,
    val fileType: String,
    val timestamp: String
)



