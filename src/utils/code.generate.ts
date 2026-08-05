import crypto from "node:crypto";

//sku(stock keeping unit) code generate for inventory identifier
export function generateSku() {
    const time = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(2).toString("hex").toUpperCase();
    return `SKU-${time}-${random}`;
}

// batch number generate
export async function generateBatchNumber(tx: any, companyId: string) {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', "");
    let sequence = 1;

    const lastBatch = await tx.inventoryBatch.findFirst({
        where: {
            companyId,
            batchNumber: {
                startsWith: `B${date}-`
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    if (lastBatch) {
        const lastSeq = Number(lastBatch.batchNumber.split("-")[1]);
        sequence = lastSeq + 1;
    }

    return `B${date}-${String(sequence).padStart(4, "0")}`;
}

// otp code generate
export function generateOtp() {
    return crypto.randomInt(100000, 1000000).toString();
}