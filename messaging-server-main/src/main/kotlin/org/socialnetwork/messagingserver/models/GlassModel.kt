package org.socialnetwork.messagingserver.models

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field

@Document(collection = "glasses_types")
data class GlassModel(

    @Id
    val id: String? = null,

    @Field("type")
    val type: String,

    @Field("supportedProfiles")
    val supportedProfiles: List<String>,

    @Field("pricePerSquareMeter")
    val pricePerSquareMeter: Double,

    @Field("imageData")
    val imageData: List<Byte>? = null
)
