package org.socialnetwork.messagingserver.models

data class ProjectDTO(
    val projectId: String,
    val clientId: String,
    val projectAddress: String,
    val items: List<ItemModelDTO>,
    val factoryIds: List<String>,
    val quoteStatuses: Map<String, QuoteStatus>,
    val boqPdf: List<Byte>?,
    val createdAt: String,
    val quotes: Map<String, QuoteModel> // ✅ הוספת השדה החדש
)
