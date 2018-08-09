
import CpuMemory from "./CpuMemory";

import {INSTRUCTIONS, Interrupt, MODE_HANDLERS, OP_CODE_HANDLERS} from "./Common";
import Apu from "./Apu";
import Ppu from "./Ppu";
import Controller from "./controllers/Controller";
import Rom from "./Rom";

export default class Cpu
{
    // Hardware connected to Cpu
    readonly memory: CpuMemory = new CpuMemory();
    readonly apu: Apu = new Apu();
    readonly controller: Controller;
    rom: Rom;
    ppu: Ppu;

    // Cycles Counter
    cycles = 0;

    // Branch counter used by some opcodes for extra cycles
    // when pages are crossed
    b = 0;
    pc = 0x00;

    // Stack Pointer
    sp = 0x00;

    // Registers
    a = 0;
    x = 0;
    y = 0;

    // Flags
    c = 0; //Carry flag
    z = 0; // Zero flag
    i = 0; // Interrupt flag
    d = 0; // Decimal flag
    // Break flag
    v = 0; // Overflow flag
    n = 0; // Negative flag
    // Unused flag

    // Interrupt type
    interrupt: Interrupt|null = null;

    stallCounter = 0;

    // Tick variables
    tmpCycles = 0;
    instrCycles = 0;
    instrCode = 0;
    instrOpCode = 0;
    instrMode = 0;
    instrSize = 0;
    address = 0;

    constructor(rom: Rom, controller: Controller = new Controller())
    {
        this.rom = rom;
        this.ppu = new Ppu(rom.mapper);
        this.controller = controller;
        this.reset();
    }

    loadJson()
    {
    }

    saveJson()
    {
    }

    loadRom(rom: Rom): void
    {
        this.rom = rom;
        this.ppu = new Ppu(rom.mapper);
    }

    stall()
    {
        if (this.cycles % 2 === 1) {
            this.stallCounter += 514;
        } else {
            this.stallCounter += 513;
        }
    }

    reset()
    {
        this.cycles = 0;
        this.a = 0;
        this.x = 0;
        this.y = 0;
        this.interrupt = null;
        this.stallCounter = 0;
        this.pc = this.read16(0xfffc);
        this.sp = 0xfd;
        this.setFlags(0x24);
    }

    tick(): number
    {
        this.tmpCycles = this.cycles;
        this.b = 0;

        // Stalled after PPU OAMDMA
        if (this.stallCounter > 0) {
            this.stallCounter--;
            // Should return 1 but this somehow fixes some games.
            // Probably due to Cpu being not exactly accurate
            // ¯\_(ツ)_/¯
            return 0;
        }

        if (this.interrupt !== null) {
            if (this.interrupt !== Interrupt.IRQ || this.i !== 0) {
                this.stackPush16(this.pc);
                this.stackPush8(this.getFlags() & ~0x10);
            }
            switch (this.interrupt) {
                case Interrupt.NMI:
                    this.pc = this.read16(0xfffa);
                    break;
                case Interrupt.IRQ:
                    if (this.i !== 0) {
                        this.pc = this.read16(0xfffe);
                    }
                    break;
            }
            if (this.interrupt !== Interrupt.IRQ || this.i !== 0) {
                this.i = 1;
                this.cycles += 7;
            }

            this.interrupt = null;
            return 7;
        }

        try {
            this.instrCode = this.read8(this.pc);
        } catch (err) {
            throw new Error('Could not read next instruction: ' + err);
        }

        let instruction = INSTRUCTIONS[this.instrCode];
        if (!instruction) {
            throw new Error('Invalid instruction ' + this.instrCode);
        }

        [this.instrOpCode, this.instrMode, this.instrSize, this.instrCycles] = instruction;

        let modeHandler = MODE_HANDLERS[this.instrMode];
        if (!modeHandler) {
            throw new Error('Invalid mode ' + this.instrMode);
        }
        this.address = modeHandler(this);

        this.pc += this.instrSize;
        this.cycles += this.instrCycles;

        let opCodeHandler = OP_CODE_HANDLERS[this.instrOpCode];
        if (!opCodeHandler) {
            throw new Error('No handler for opcode ' + this.instrOpCode);
        }

        opCodeHandler(this, this.address);
        return this.cycles - this.tmpCycles;
    }

    /**
     * Interrupts
     */
    triggerNmi()
    {
        this.interrupt = Interrupt.NMI;
    }

    triggerIrq()
    {
        this.interrupt = Interrupt.IRQ;
    }

    /**
     * Read & Write methods
     *
     * Cpu RAM: 0x0000 => 0x2000
     * PPU Registers: 0x2000 => 0x4000
     * Controller: 0x4016
     * Controller2: 0x4016
     * ROM Mapper: 0x6000 => 0x10000
     */

    read8(address: number): number
    {
        if (address < 0x2000) {
            return this.memory.read8(address);
        } else if (address < 0x4000) {
            // 7 bytes PPU registers
            // mirrored from 0x2000 to 0x4000
            return this.ppu.read8(0x2000 + (address % 8));
        } else if (address == 0x4014) {
            return this.ppu.read8(address);
        } else if (address == 0x4015) {
            return this.apu.read8();
        } else if (address == 0x4016) {
            return this.controller.read8();
        } else if (address == 0x4017) {
            return 0;
        } else if (address < 0x6000) {
            console.log("I/O REGISTERS");
            return 0;
        } else {
            return this.ppu.memory.mapper.read8(address);
        }
    }

    read16(address: number): number
    {
        // Read two bytes and concatenate them
        return (this.read8(address + 1) << 8) | this.read8(address);
    }

    read16Indirect(address: number): number
    {
        // Special read16 method for indirect mode reading (NES bug)
        let addr2 = (address & 0xff00) | (((address & 0xff) + 1) & 0xff);
        let lo = this.read8(address);
        let hi = this.read8(addr2);
        return (hi << 8) | lo;
    }

    write8(address: number, value: number): void
    {
        if (address < 0x2000) {
            this.memory.write8(address, value);
        } else if (address < 0x4000) {
            // 7 bytes PPU registers
            // mirrored from 0x2000 to 0x4000
            this.ppu.write8(0x2000 + (address % 8), value);
        } else if (address == 0x4014) {
            // This might seem a bit odd but this avoids circular reference (ppu using cpu methods)
            address = value << 8;
            this.ppu.tmpOamAddress = this.ppu.oamAddress;

            for (let i = 0; i < 256; i++) {
                this.ppu.memory.oam[this.ppu.oamAddress] = this.read8(address);
                this.ppu.oamAddress++;
                address++;
            }

            this.ppu.oamAddress = this.ppu.tmpOamAddress;
            this.stall();
        } else if (address == 0x4015) {
            this.apu.write8(address, value);
        } else if (address == 0x4016) {
            this.controller.write8(value);
        } else if (address == 0x4017) {
            // TODO sound
        } else if (address >= 0x6000) {
            // Write to mapper (handled by PPU)
            this.ppu.memory.mapper.write8(address, value);
        } else if (address < 0x6000) {
            // console.log('I/O REGISTERS');
        }
    }

    /**
     * Stack methods
     */
    stackPush8(value: number): void
    {
        this.memory.stack[this.sp] = value;
        this.sp = (this.sp - 1) & 0xff;
    }

    stackPush16(value: number): void
    {
        // Get the 8 highest bits
        // Truncate the 8 lower bits
        // Push the two parts of `value`
        this.stackPush8(value >> 8);
        this.stackPush8(value & 0xff);
    }

    stackPull8(): number
    {
        this.sp = (this.sp + 1) & 0xff;
        return this.memory.stack[this.sp];
    }

    stackPull16(): number
    {
        return this.stackPull8() | (this.stackPull8() << 8);
    }

    /**
     * Flag methods
     */
    setZeroFlag(value: number): void
    {
        if (value === 0) {
            this.z = 1;
        } else {
            this.z = 0;
        }
    }

    setNegativeFlag(value: number): void
    {
        if ((value & 0x80) !== 0) {
            this.n = 1;
        } else {
            this.n = 0;
        }
    }

    getFlags(): number
    {
        // Concatenate the values of the flags in an int
        let flags = 0;
        flags = flags | (this.c << 0);
        flags = flags | (this.z << 1);
        flags = flags | (this.i << 2);
        flags = flags | (this.d << 3);
        flags = flags | (0 << 4);
        flags = flags | (1 << 5);
        flags = flags | (this.v << 6);
        flags = flags | (this.n << 7);
        return flags;
    }

    setFlags(value: number): void
    {
        this.c = (value >> 0) & 1;
        this.z = (value >> 1) & 1;
        this.i = (value >> 2) & 1;
        this.d = (value >> 3) & 1;
        this.v = (value >> 6) & 1;
        this.n = (value >> 7) & 1;
    }
}
