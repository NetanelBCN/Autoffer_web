package org.socialnetwork.messagingserver.models

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document

@Document(collection = "chats")
data class ChatModel(
    @Id val id: String? = null,
    val participants: List<String>,
    var lastMessage: String,
    var lastMessageTimestamp: String
)

