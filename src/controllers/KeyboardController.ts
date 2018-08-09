

import {Button} from "../Common";
import Controller from "./Controller";

/**
 * The 8 controller buttons are mapped on 8bits
 */
export default class KeyboardController extends Controller
{
    static defaultElement: HTMLElement|null = typeof window !== 'undefined' && window.document
        ? window.document.documentElement
        : null;

    private keyMap: Map<string, Button> = new Map([
        ['Enter', Button.START],
        ['Shift', Button.SELECT],
        ['KeyK', Button.A],
        ['KeyL', Button.B],
        ['KeyW', Button.UP],
        ['KeyS', Button.DOWN],
        ['KeyA', Button.LEFT],
        ['KeyD', Button.RIGHT]
    ]);

    constructor(element: HTMLElement|null = KeyboardController.defaultElement)
    {
        super();
        if (!element) {
            throw new Error('Failed to determine an HTML element to listen to keyboard keys');
        }
        element.addEventListener('keydown', this.onKeyDown.bind(this));
        element.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    protected onKeyDown(event: KeyboardEvent): void
    {
        if (!this.keyMap.has(event.code)) {
            return;
        }
        let button = this.keyMap.get(event.code) as Button;
        this.buttons[button] = 1;
    }

    protected onKeyUp(event: KeyboardEvent): void
    {
        if (!this.keyMap.has(event.code)) {
            return;
        }
        let button = this.keyMap.get(event.code) as Button;
        this.buttons[button] = 0;
    }
}
