export const DirTable = [];
for (let i = 0; i < 360; i++) {
    const rad = i * Math.PI / 180;
    DirTable[i] = { x: Math.sin(rad), y: -Math.cos(rad) };
}