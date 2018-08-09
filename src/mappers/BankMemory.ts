
export default class BankMemory
{
    data: Uint8Array;
    windowSize: number;
    fixed: boolean;

    bankNbr: number;
    pointers: Uint8Array;

    swapMode = 0;

    // Tmp variables
    p = 0;
    o = 0;
    p1 = 0;
    p2 = 0;

    constructor(data: Uint8Array, windowSize: number, fixed: boolean)
    {
        this.data = data;
        this.windowSize = windowSize;
        this.fixed = fixed;

        this.bankNbr = parseInt(String(this.data.length / 0x0400));
        this.pointers = new Uint8Array(parseInt((windowSize / 0x0400).toString())).fill(0);

        for (let i = 0; i < this.pointers.length; i++) {
            this.pointers[i] = i;
        }
    }

    switchBank(fromAddress: number, toAddress: number, value: number): void
    {
        this.p1 = parseInt((fromAddress / 0x0400).toString());
        this.p2 = parseInt((toAddress / 0x0400).toString());
        // Explain
        value = value * (this.p2 - this.p1);

        for (let i = this.p1; i < this.p2; i++) {
            this.pointers[i] = value + (i - this.p1);
        }
    }

    write8(address: number, value: number): void
    {
        this.p = parseInt((address / 0x0400).toString());
        this.o = address % 0x0400;
        this.data[this.pointers[this.p] * 0x0400 + this.o] = value;
    }

    read8(address: number): number
    {
        this.p = parseInt((address / 0x0400).toString());
        this.o = address % 0x0400;
        return this.data[this.pointers[this.p] * 0x0400 + this.o];
    }
}
