import { ExtensionContext, Range } from 'vscode';
import * as vscode from 'vscode';
import { EOL } from 'os';
import * as _ from 'lodash';


function getOneLineCommentStart(languageId) {
    switch (languageId) {
        case 'arendelle':
        case 'pageman':
        case 'javascript':
        case 'javascriptreact':
        case 'typescript':
        case 'typescriptreact':
        case 'swift':
        case 'csharp':
        case 'cpp':
        case 'objective-c':
        case 'processing':
        case 'java':
        case 'json':
        case 'rust':
        case 'go':
        case 'scala':
        case 'qml':
        case 'stylus':
        case 'groovy':
        case 'less':
        case 'pegjs':
        case 'php':
        case 'scss':
        case 'sass':
        case 'uno':
            return '//';

        case 'ruby':
        case 'python':
        case 'julia':
        case 'make':
        case 'makefile':
        case 'shell':
        case 'bash':
        case 'shellscript':
        case 'coffeescript':
        case 'powershell':
        case 'perl':
        case 'r':
        case 'yaml':
        case 'yml':
        case 'fish':
            return '#';

        case 'tex':
        case 'latex':
        case 'matlab':
        case 'octave':
            return '%';

        case 'lua':
        case 'haskell':
        case 'elm':
            return '--';

        case 'scheme':
        case 'racket':
        case 'lisp':
        case 'clojure':
            return ';;;';

        case 'bat':
            return '::';

        case 'vb':
            return "'";



        default:
            return null;
    }
}


export class Commenter {

    private static countSpacesRegex = /^(\s*).*$/m;

    constructor(private context:ExtensionContext){
        
    }

    boxComment() {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        var ctag = getOneLineCommentStart(editor.document.languageId) || " ";
        var clen = ctag.length;




        var selection = editor.selection;
        var startLine = selection.start.line;
        var endLine = selection.end.line;

        var {lines, range} = this._getMultiLineRange(editor, startLine, endLine);

        //remove comments from lines
        lines = _.map(lines, (line) => {
            return this._removeComment(line, ctag);
        });


        var indents = _.map(lines, (line) => {
            let m = Commenter.countSpacesRegex.exec(line);
            if (m) {
                return m[1] ? m[1].length : 0;
            } else {
                return 0;
            }
        });


        var maxLength = _.maxBy(lines, "length").length;
        //round to the nearest multiple of commentStart.length

        //es:
        //--two spaces-
        //no spaces
        //---three spaces
        //--*-three spaces *

        var baseIndent = _.min(indents);
        // if(baseIndent==1) baseIndent=0;

        // maxLength = Math.ceil(maxLength/clen)*clen;
        //this is the length of the separator, in terms of comment start sequence
         var separatorLength = Math.ceil((maxLength - baseIndent + 1 + 2 * clen) / clen);

        var separatorLine = lines[0].substr(0, baseIndent) + _.repeat(ctag, separatorLength);

        //TODO: use this regex https://regex101.com/r/UHevBM/1

        lines = lines.map(line => {

            var trail = separatorLength * clen - 2 * clen - 1 - line.length + baseIndent;

            return line.substr(0, baseIndent)
                + ctag
                + " "
                + line.substr(baseIndent)
                + _.repeat(" ", trail)
                + ctag;
        });

        // var newText = ).concat(separatorLine).join(EOL);
        var newText = [separatorLine].concat(lines).concat(separatorLine).join(EOL);
        editor.edit(editBuilder => {
            editBuilder.replace(range, newText);
        })




        //var text = editor.document.getText(selection);
    }

   

    private _nearesMultiple(num, mult) {
        return Math.ceil(num / mult) * mult;
    }

    //https://regex101.com/r/ggpvge/1
    private _removeComment(line, ctag) {
        var escctag = this._escapeRegExp(ctag);
        var regex = new RegExp(`(\\s*)(${escctag}\\s?)(.*)`);
        var ret = line.replace(regex, "$1$3");
        return ret;
    }
    //see: http://stackoverflow.com/questions/3446170/
    private _escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
    dispose() {

    }

    private _getMultiLineRange(editor, startLine, endLine): { lines: string[], range: Range } {
        var lines = [];
        var range: Range = null;
        for (var l = startLine; l <= endLine; l++) {
            lines.push(editor.document.lineAt(l).text);
            if (!range) {
                range = editor.document.lineAt(l).range;
            } else {
                range = range.union(editor.document.lineAt(l).range);
            }
        }
        return { lines, range };
    }
}

