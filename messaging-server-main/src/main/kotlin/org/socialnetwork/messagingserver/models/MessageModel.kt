package org.socialnetwork.messagingserver.models

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document

@Document(collection = "messages")
data class MessageModel(
    @Id val id: String? = null,
    val chatId: String,
    val senderId: String,
    val receiverId: String,
    val content: String,
    val timestamp: String,
    val readBy: MutableList<String> = mutableListOf(),

    // 🔥 הוספה חדשה בשביל תמיכה בקבצי PDF
    val fileBytes: List<Byte>? = null,
    val fileName: String? = null,
    val fileType: String? = null
)
