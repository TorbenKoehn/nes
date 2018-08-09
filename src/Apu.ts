// https://nesdoug.com/2015/12/02/14-intro-to-sound/
// https://wiki.nesdev.com/w/index.php/APU_Frame_Counter

export default class Apu
{
    save(): number[]
    {
        return [];
    }

    load(data: number[]): void
    {
    }

    write8(address: number, value: number)
    {
    }

    read8(): number
    {
        return 255;
    }

    tick()
    {
    }
}
