package org.socialnetwork.messagingserver.models

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document

@Document(collection = "ads")
data class AdModel(
    @Id
    val id: String? = null,
    val title: String,
    val description: String,
    val imageUrl: String,
    val audience: String
)


