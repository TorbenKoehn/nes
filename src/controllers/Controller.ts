
/**
 * The 8 controller buttons are mapped on 8bits
 */
export default class Controller
{
    private strobe: number = 0;
    private i: number = 0;
    readonly buttons: Uint8Array = new Uint8Array(8).fill(0);

    constructor()
    {
    }

    write8(value: number): void
    {
        this.strobe = value;
        if (this.strobe & 1) {
            this.i = 0;
        }
    }

    read8(): number
    {
        return this.buttons[this.i++];
    }
}
