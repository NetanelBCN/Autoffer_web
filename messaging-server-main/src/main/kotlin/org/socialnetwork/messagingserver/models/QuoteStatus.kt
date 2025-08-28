package org.socialnetwork.messagingserver.models

enum class QuoteStatus {
    PENDING,       // נשלח ועדיין אין תגובה מהמפעל
    RECEIVED,      // המפעל שלח הצעת מחיר
    ACCEPTED,      // הלקוח קיבל את הצעת המפעל
    REJECTED       // הלקוח דחה את הצעת המפעל
}
