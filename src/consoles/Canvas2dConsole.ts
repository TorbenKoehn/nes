
import Console, {Frame} from './Console';
import Controller from "../controllers/Controller";
import KeyboardController from "../controllers/KeyboardController";

export default class Canvas2dConsole extends Console
{
    readonly element: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;

    constructor(element: HTMLCanvasElement, controller: Controller = new KeyboardController())
    {
        super(controller);
        this.element = element;
        this.element.width = 256;
        this.element.height = 240;

        let context = element.getContext('2d');
        if (!context) {
            throw new Error('CanvasRenderingContext2D not available');
        }
        this.context = context;
    }

    protected onFrameReady(frame: Frame): void
    {
        super.onFrameReady(frame);

        console.log('Frame', frame.buffer.length);
    }
}