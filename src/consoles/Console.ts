
import Cpu from "../Cpu";
import Rom from "../Rom";
import Controller from "../controllers/Controller";
import {Interrupt} from "../Common";

export interface Frame
{
    buffer: Uint8Array;
    backgroundBuffer: Uint8Array;
    spriteBuffer: Uint8Array;
    colorBuffer: Uint32Array;
}

/**
 * Main class for the emulator, controls the hardware emulation.
 * Fires up events.
 */
export default class Console
{
    readonly controller: Controller;
    private rom: Rom|null = null;
    private cpu: Cpu|null = null;

    private cycles: number = 0;
    private interrupt: Interrupt|null = null;

    private currentFrameId: number = 0;
    private running: boolean = false;

    constructor(controller: Controller)
    {
        this.controller = controller;
        this.tick = this.tick.bind(this);
    }

    loadRom(buffer: Uint8Array)
    {
        this.rom = new Rom(buffer);
        this.cpu = new Cpu(this.rom, this.controller);
    }

    reset()
    {
        if (!this.cpu) {
            return;
        }
        this.cpu.reset();
        this.cpu.ppu.reset();
    }

    quickSave()
    {
        //TODO: Re-implement with load/save everywhere
    }

    loadQuickSave()
    {
        //TODO: Re-implement with load/save everywhere
    }

    start()
    {
        this.running = true;
        this.currentFrameId = requestAnimationFrame(this.tick);
    }

    stop()
    {
        this.running = false;
        cancelAnimationFrame(this.currentFrameId);
    }

    tick(elapsedTime: number): void
    {
        if (!this.cpu || !this.running) {
            cancelAnimationFrame(this.currentFrameId);
            return;
        }

        requestAnimationFrame(this.tick);
        let {ppu, apu} = this.cpu;

        this.cycles = this.cpu.tick();
        for (let c = this.cycles; c > 0; c--) {
            apu.tick();
        }

        for (let c = this.cycles * 3; c > 0; c--) {
            this.interrupt = ppu.tick();

            if (this.interrupt !== null) {
                if (this.interrupt === Interrupt.NMI) {
                    this.cpu.triggerNmi();
                } else if (this.interrupt === Interrupt.IRQ) {
                    this.cpu.triggerIrq();
                }
            }

            if (ppu.frameReady) {
                this.onFrameReady({
                    buffer: ppu.frameBuffer,
                    backgroundBuffer: ppu.frameBackgroundBuffer,
                    spriteBuffer: ppu.frameSpriteBuffer,
                    colorBuffer: ppu.frameColorBuffer
                });
                ppu.acknowledgeFrame();
                return;
            }
        }
    }

    protected onFrameReady(frame: Frame): void
    {
    }
}
