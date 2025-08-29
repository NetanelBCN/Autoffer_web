package org.socialnetwork.messagingserver.models

import org.bson.types.ObjectId
import java.time.Instant

data class QuoteModel(
    val id: String = ObjectId().toHexString(),
    val factoryId: String,
    val projectId: String,
    val pricedItems: List<ItemModelDTO>,
    val factor: Double,
    val finalPrice: Double,
    val quotePdf: List<Byte>,
    val status: String, // RECEIVED, CONFIRMED, DECLINED
    val createdAt: Instant = Instant.now()
)
