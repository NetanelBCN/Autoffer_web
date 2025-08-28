package org.socialnetwork.messagingserver.models

import org.bson.types.ObjectId
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field
import java.time.Instant

@Document(collection = "projects")
data class ProjectModel(
    @Id val id: String? = null,
    @Field("clientId")
    val clientId: String,

    val projectAddress: String,
    val items: List<ItemModelDTO>,
    val factoryIds: List<String>,

    val quoteStatuses: Map<String, QuoteStatus> = emptyMap(),
    val boqPdf: List<Byte>? = null,

    @Field("quotes")
    val quotes: Map<String, QuoteModel> = emptyMap(),

    val createdAt: Instant = Instant.now()
)
