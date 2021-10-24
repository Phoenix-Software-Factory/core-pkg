export function getB64(u) {
    return new Promise(async resolve => {
        const response = await fetch(u);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = function () {
            resolve(this.result)
        };
        reader.readAsDataURL(blob);
    })
}
