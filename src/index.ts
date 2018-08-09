
import Console from './consoles/Console';
import Canvas2dConsole from "./consoles/Canvas2dConsole";
import Controller from "./controllers/Controller";
import KeyboardController from "./controllers/KeyboardController";

export {
    Controller,
    KeyboardController,
    Console,
    Canvas2dConsole
};

export function loadRom(url: string): Promise<ArrayBuffer>
{
    return new Promise((resolve, reject) =>
    {
        let request = new XMLHttpRequest();
        request.responseType = 'arraybuffer';
        request.open('GET', url);
        request.addEventListener('load', () => resolve(request.response));
        request.send();
    });
}

async function loadConsoles(): Promise<void>
{
    let tasks = [];
    for (let element of document.querySelectorAll('[data-nes]')) {
        let controller: Controller,
            console: Console,
            dataset = (element as HTMLElement).dataset,
            type = dataset.nes || '2d',
            controllerType = dataset.controller || 'keyboard',
            rom = dataset.rom || 'http://grun7.com/roms/super-mario-bros.nes';

        window.console.log('Loading console on ', element, type, controllerType, rom);
        switch (controllerType) {
            default:
            case 'keyboard':
                controller = new KeyboardController();
                break;
        }

        switch (type) {
            default:
            case '2d':
                console = new Canvas2dConsole(element as HTMLCanvasElement, controller);
                break;
        }

        tasks.push((async () =>
        {
            window.console.log('Loading ROM ' + rom);
            let buffer = await loadRom(rom);
            console.loadRom(new Uint8Array(buffer));
            window.console.log('Loaded ROM ' + rom);
            console.start();
        })());
    }

    await Promise.all(tasks);
}

if (typeof window !== 'undefined') {
    addEventListener('DOMContentLoaded', () =>
    {
        loadConsoles().then(() => console.log('Consoles loaded'));
    });
}