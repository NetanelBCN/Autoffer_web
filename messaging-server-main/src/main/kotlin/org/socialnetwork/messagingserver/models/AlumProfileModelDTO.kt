package org.socialnetwork.messagingserver.models

data class AlumProfileModelDTO(
    val profileNumber: String,
    val usageType: AlumProfileUsageType,
    val pricePerSquareMeter: Double
)