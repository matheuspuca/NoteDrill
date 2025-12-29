export async function getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "Anonymous"
        img.src = url
        img.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext("2d")
            if (!ctx) {
                reject(new Error("Failed to get canvas context"))
                return
            }
            ctx.drawImage(img, 0, 0)
            const dataURL = canvas.toDataURL("image/png")
            resolve(dataURL)
        }
        img.onerror = (error) => {
            reject(error)
        }
    })
}
