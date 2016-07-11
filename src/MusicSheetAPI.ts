import {IXmlElement} from "./Common/FileIO/Xml";
import {VexFlowMusicSheetCalculator} from "./MusicalScore/Graphical/VexFlow/VexFlowMusicSheetCalculator";
import {MusicSheetReader} from "./MusicalScore/ScoreIO/MusicSheetReader";
import {GraphicalMusicSheet} from "./MusicalScore/Graphical/GraphicalMusicSheet";
import {MusicSheetCalculator} from "./MusicalScore/Graphical/MusicSheetCalculator";
import {VexFlowMusicSheetDrawer} from "./MusicalScore/Graphical/VexFlow/VexFlowMusicSheetDrawer";
import {MusicSheet} from "./MusicalScore/MusicSheet";
import {Fraction} from "./Common/DataObjects/fraction";
import {OutlineAndFillStyleEnum} from "./MusicalScore/Graphical/DrawingEnums";

export class MusicSheetAPI {
    constructor(container: HTMLElement) {
        this.container = container;
        this.titles = document.createElement("div");
        this.canvas = document.createElement("canvas");
        this.container.appendChild(this.titles);
        this.container.appendChild(this.canvas);
        this.drawer = new VexFlowMusicSheetDrawer(this.titles, this.canvas);
    }

    private container: HTMLElement;
    private titles: HTMLElement;
    private canvas: HTMLCanvasElement;
    private sheet: MusicSheet;
    private drawer: VexFlowMusicSheetDrawer;
    private graphic: GraphicalMusicSheet;
    private zoom: number = 1.0;
    private unit: number = 10.0;

    private fraction: Fraction = new Fraction(0, 4);

    /**
     * Load a MusicXML file
     * @param doc is the root node of a MusicXML document
     */
    public load(content: string|Document): void {
        this.reset();
        let elem: Element;
        let path: string = "Unknown path";
        if (typeof content === "string") {
            if ((<string>content).substr(0, 4) === "http") {
                path = <string>content;
                content = this.loadURL(path);
            }
            //if (<string>content.substr() === "")
        }
        if ("nodeName" in <any>content) {
            elem = (<Document>content).getElementsByTagName("score-partwise")[0];
            if (elem === undefined) {
                throw new Error("Invalid partwise MusicXML document");
            }
        }
        let score: IXmlElement = new IXmlElement(elem);
        let calc: MusicSheetCalculator = new VexFlowMusicSheetCalculator();
        let reader: MusicSheetReader = new MusicSheetReader();
        this.sheet = reader.createMusicSheet(score, path);
        this.graphic = new GraphicalMusicSheet(this.sheet, calc);
    }

    /**
     * Set the zoom
     * @param factor is the zooming factor
     */
    public scale(factor: number): void {
        this.zoom = factor;
    }

    /**
     * Render the music sheet in the container
     */
    public render(): void {
        this.resetTitle();
        if (!this.graphic) {
            throw new Error("OSMD: Before rendering a music sheet, please load a MusicXML file");
        }
        let width: number = this.container.offsetWidth;
        if (isNaN(width)) {
            throw new Error("OSMD: Before rendering a music sheet, please set the width of the container");
        }
        // Set page width
        this.sheet.pageWidth = width / this.zoom / this.unit;
        // Calculate again
        this.graphic.reCalculate();
        // Update Sheet Page
        let height: number = this.graphic.MusicPages[0].PositionAndShape.BorderBottom * this.unit * this.zoom;
        this.drawer.resize(width, height);
        // Fix the label problem
        // this.drawer.translate(0, 100);
        this.drawer.scale(this.zoom);
        // Finally, draw
        this.drawer.drawSheet(this.graphic);
    }

    public next(): void {
        //calculateCursorLineAtTimestamp
        //let iterator: MusicPartManagerIterator = this.sheet.MusicPartManager.getIterator();
        //while (!iterator.EndReached && iterator.CurrentVoiceEntries !== undefined) {
        //    for (let idx: number = 0, len: number = iterator.CurrentVoiceEntries.length; idx < len; ++idx) {
        //        let voiceEntry: VoiceEntry = iterator.CurrentVoiceEntries[idx];
        //        for (let idx2: number = 0, len2: number = voiceEntry.Notes.length; idx2 < len2; ++idx2) {
        //            let note: Note = voiceEntry.Notes[idx2];
        //            note.state = NoteState.Normal;
        //        }
        //    }
        //    iterator.moveToNext();
        //}
        this.graphic.Cursors.length = 0;
        this.graphic.Cursors.push(this.graphic.calculateCursorLineAtTimestamp(this.fraction, OutlineAndFillStyleEnum.PlaybackCursor));
        this.fraction.Add(new Fraction(1, 8));
        this.render();
    }

    private loadURL(url: string): Document {
        return undefined;
    }

    //private loadMXL(content: string): Document {
    //    return undefined;
    //}

    private resetTitle(): void {
        // Empty this.titles
        while (this.titles.firstChild) {
            this.titles.removeChild(this.titles.firstChild);
        }
    }

    /**
     * Initialize this object to default values
     */
    private reset(): void {
        this.sheet = undefined;
        this.graphic = undefined;
        this.zoom = 1.0;
        this.unit = 10.0;
        this.resetTitle();
    }
}