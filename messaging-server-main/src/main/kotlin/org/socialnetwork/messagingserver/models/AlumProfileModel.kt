package org.socialnetwork.messagingserver.models

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document

@Document(collection = "aluminum_profiles")
data class AlumProfileModel(
    @Id val id: String? = null,
    val profileNumber: String,
    val usageType: AlumProfileUsageType,
    val minHeight: Int,
    val maxHeight: Int,
    val minWidth: Int,
    val maxWidth: Int,
    val isExpensive: Boolean,
    val recommendedGlassType: String,
    val pricePerSquareMeter: Double, // ✅ חדש
    val imageData: List<Byte>? = null
)


