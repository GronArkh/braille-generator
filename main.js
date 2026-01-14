var fontsArr = {}; 
var canvas;
var currentScale = 2;
var isCanvasInitialized = false;
var nameObject;
var addressObject;
var brailleObject; 
var frameObject;
var modeOfOperationObject; 
var modeOfOperationDetailsObject; 
var horizontalLineObject; 

const SIZES = {
    '400x300': { width: 1000, height: 750 },
    '500x400': { width: 1250, height: 1000 },
    '600x400': { width: 1500, height: 1000 }
};

var currentSize = '600x400';
var realWidth = SIZES[currentSize].width;
var realHeight = SIZES[currentSize].height;

const NAME_FONT_RATIO = 0.105; 
const ADDRESS_FONT_RATIO = 0.05; 
const BRAILLE_FIXED_FONT_SIZE = 24; 
const TEXT_PADDING_PERCENT = 0.055;
const MIN_FONT_SIZE = 10;
const MODE_OF_OPERATION_FONT_RATIO = 0.065; 
const MODE_OF_OPERATION_DETAILS_FONT_RATIO = 0.05; 
const HORIZONTAL_LINE_COLOR = '#1d1d1b'; 
const HORIZONTAL_LINE_STROKE_FACTOR = 0.0075; 

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ДЕБАУНСИНГА ---
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}
// --- КОНЕЦ ВСПОМОГАТЕЛЬНОЙ ФУНКЦИИ ---

// Функция для автоматического изменения высоты textarea
function autoGrowTextarea(element) {
    element.style.height = 'auto'; 
    element.style.height = (element.scrollHeight) + 'px';
}

function updateCanvasScale() {
    if (!isCanvasInitialized) return;
    
    var containerWidth = $('#canvas-container').width();
    currentScale = containerWidth / realWidth;
    
    $('#canvas-container').css({
        'height': (realHeight * currentScale) + 'px'
    });
    
    $('.canvas-container').css({
        'transform': 'scale(' + currentScale + ')',
        'transform-origin': '0 0'
    });
    
    canvas.setDimensions({
        width: realWidth,
        height: realHeight
    });
    
    if (nameObject) {
        nameObject.set('fontSize', realHeight * NAME_FONT_RATIO); 
        adjustNameSize(nameObject); 
    }
    
    if (modeOfOperationObject) {
        modeOfOperationObject.set('fontSize', realHeight * MODE_OF_OPERATION_FONT_RATIO);
        adjustModeOfOperationText(modeOfOperationObject);
    }

    if (modeOfOperationDetailsObject) {
        modeOfOperationDetailsObject.set('fontSize', realHeight * MODE_OF_OPERATION_DETAILS_FONT_RATIO);
        adjustModeOfOperationDetailsText(modeOfOperationDetailsObject);
    }
    
    if (addressObject) {
        addressObject.set('fontSize', realHeight * ADDRESS_FONT_RATIO); 
        adjustAddressSize(addressObject); 
    }

    if (brailleObject) {
        updateBrailleText(); 
    }
    
    updateAllObjectPositions(); 
    canvas.renderAll(); 
}

function loadAndPositionBackground() {
    var background = new fabric.Rect({
        width: realWidth,
        height: realHeight,
        fill: '#ffec00',
        selectable: false,
        evented: false,
        lockMovementX: true,
        lockMovementY: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true
    });
    
    var padding = Math.min(realWidth, realHeight) * 0.02;
    
    frameObject = new fabric.Rect({
        width: realWidth - padding * 2.5,
        height: realHeight - padding * 2.5,
        fill: 'transparent',
        stroke: '#1d1d1b',
        strokeWidth: Math.min(realWidth, realHeight) * 0.015,
        rx: Math.min(realWidth, realHeight) * 0.01,
        ry: Math.min(realWidth, realHeight) * 0.01,
        left: realWidth / 2,
        top: realHeight / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        lockMovementX: true,
        lockMovementY: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true
    });
    
    canvas.add(background);
    canvas.add(frameObject);
    canvas.sendToBack(background);
    canvas.renderAll();
    updateCanvasScale();
}

// --- adjustNameSize (без изменений) ---
function adjustNameSize(textObj) {
    const effectiveMaxWidth = realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2; 
    const fixedLineHeight = 1.1; 
    const maxAllowedHeight = realHeight * NAME_FONT_RATIO * (3 * fixedLineHeight + 0.01); 
    const minFontSize = MIN_FONT_SIZE;
    const initialFontSize = realHeight * NAME_FONT_RATIO; 

    const checkFontSizeFits = (size) => {
        textObj.set({
            fontSize: size,
            width: effectiveMaxWidth,
            splitByGrapheme: false,
            breakWords: false,      
            lineHeight: fixedLineHeight,
            ellipsis: true          
        }, { silent: true });
        textObj.initDimensions();

        const currentLineCount = textObj._textLines ? textObj._textLines.length : 0;
        const currentTextHeight = textObj.height;

        if (currentLineCount > 3) {
            return false;
        }
        if (currentTextHeight > maxAllowedHeight) {
            return false;
        }
        
        if (textObj.width > effectiveMaxWidth + 0.01) { 
            return false;
        }
        return true;
    };

    let low = minFontSize;
    let high = initialFontSize;
    let optimalFontSize = minFontSize;
    
    while (high - low > 0.01) { 
        let mid = (low + high) / 2;
        if (checkFontSizeFits(mid)) {
            optimalFontSize = mid;
            low = mid;
        } else {
            high = mid;
        }
    }
    
    while (!checkFontSizeFits(optimalFontSize) && optimalFontSize > minFontSize) {
        optimalFontSize -= 0.01; 
        if (optimalFontSize < minFontSize) {
            optimalFontSize = minFontSize;
            break;
        }
    }
    optimalFontSize = Math.min(optimalFontSize, initialFontSize);

    textObj.set({
        fontSize: optimalFontSize,
        left: realWidth / 2,
        originX: 'center',
        originY: 'top',
        width: effectiveMaxWidth, 
        lineHeight: fixedLineHeight,
        splitByGrapheme: false, 
        breakWords: false,      
        ellipsis: true          
    });
}

// --- adjustAddressSize (без изменений) ---
function adjustAddressSize(textObj) {
    const effectiveMaxWidth = realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2; 
    const fixedLineHeight = 1; 
    const maxAllowedHeight = realHeight * ADDRESS_FONT_RATIO * (1 * fixedLineHeight + 0.01); 
    const minFontSize = MIN_FONT_SIZE;
    const initialFontSize = realHeight * ADDRESS_FONT_RATIO;

    const checkFontSizeFits = (size) => {
        textObj.set({
            fontSize: size,
            width: effectiveMaxWidth,
            splitByGrapheme: true,    
            breakWords: true,         
            lineHeight: fixedLineHeight, 
            noWrap: false             
        }, { silent: true });
        textObj.initDimensions();

        const currentLineCount = textObj._textLines ? textObj._textLines.length : 0;
        const currentTextHeight = textObj.height;

        if (currentLineCount > 1) { 
            return false; 
        }
        if (currentTextHeight > maxAllowedHeight) {
            return false;
        }
        
        if (textObj.__charBounds && currentLineCount > 0) {
            let widestLineWidth = 0;
            for (let i = 0; i < currentLineCount; i++) {
                const lineBounds = textObj.__charBounds[i];
                if (lineBounds && lineBounds.length > 0) {
                    const firstCharLeft = lineBounds[0].left;
                    const lastCharBound = lineBounds[lineBounds.length - 1];
                    const lineCalculatedWidth = lastCharBound.left + lastCharBound.width - firstCharLeft;
                    
                    if (lineCalculatedWidth > widestLineWidth) {
                        widestLineWidth = lineCalculatedWidth;
                    }
                }
            }
            if (widestLineWidth > effectiveMaxWidth) { 
                return false; 
            }
        }
        return true;
    };

    let low = minFontSize;
    let high = initialFontSize;
    let optimalFontSize = minFontSize;
    
    while (high - low > 0.01) { 
        let mid = (low + high) / 2;
        if (checkFontSizeFits(mid)) {
            optimalFontSize = mid;
            low = mid;
        } else {
            high = mid;
        }
    }
    
    while (!checkFontSizeFits(optimalFontSize) && optimalFontSize > minFontSize) {
        optimalFontSize -= 0.01; 
        if (optimalFontSize < minFontSize) {
            optimalFontSize = minFontSize;
            break;
        }
    }
    optimalFontSize = Math.min(optimalFontSize, initialFontSize);

    textObj.set({
        fontSize: optimalFontSize,
        left: realWidth / 2,
        originX: 'center',
        width: effectiveMaxWidth, 
        lineHeight: fixedLineHeight,
        noWrap: false 
    });
}

// --- adjustModeOfOperationText ---
function adjustModeOfOperationText(textObj) {
    const effectiveMaxWidth = realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2; 
    const initialFontSize = realHeight * MODE_OF_OPERATION_FONT_RATIO;
    const fixedLineHeight = 1; 

    textObj.set({
        fontSize: initialFontSize, 
        width: effectiveMaxWidth,
        splitByGrapheme: false,
        breakWords: false,
        lineHeight: fixedLineHeight,
        ellipsis: true, 
        noWrap: false 
    }, { silent: true });
    textObj.initDimensions();

    let currentFontSize = initialFontSize;
    while (textObj.width > effectiveMaxWidth + 0.01 && currentFontSize > MIN_FONT_SIZE) {
         currentFontSize -= 1; 
         textObj.set('fontSize', currentFontSize, { silent: true });
         textObj.initDimensions();
    }

    textObj.set({
        fontSize: currentFontSize,
        left: realWidth / 2,
        originX: 'center',
        originY: 'top', 
        width: effectiveMaxWidth,
        lineHeight: fixedLineHeight
    });
    // Top позиция будет установлена updateAllObjectPositions()
}

// --- adjustModeOfOperationDetailsText ---
function adjustModeOfOperationDetailsText(textObj) {
    const effectiveMaxWidth = realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2; 
    const fixedLineHeight = 1.1; 
    const maxAllowedHeight = realHeight * MODE_OF_OPERATION_DETAILS_FONT_RATIO * (3 * fixedLineHeight + 0.01); 
    const minFontSize = MIN_FONT_SIZE;
    const initialFontSize = realHeight * MODE_OF_OPERATION_DETAILS_FONT_RATIO; 

    const checkFontSizeFits = (size) => {
        textObj.set({
            fontSize: size,
            width: effectiveMaxWidth,
            splitByGrapheme: false,
            breakWords: false,      
            lineHeight: fixedLineHeight,
            ellipsis: true          
        }, { silent: true });
        textObj.initDimensions();

        const currentLineCount = textObj._textLines ? textObj._textLines.length : 0;
        const currentTextHeight = textObj.height;

        if (currentLineCount > 3) { 
            return false;
        }
        if (currentTextHeight > maxAllowedHeight) {
            return false;
        }
        
        if (textObj.width > effectiveMaxWidth + 0.01) { 
            return false;
        }
        return true;
    };

    let low = minFontSize;
    let high = initialFontSize;
    let optimalFontSize = minFontSize;
    
    while (high - low > 0.01) { 
        let mid = (low + high) / 2;
        if (checkFontSizeFits(mid)) {
            optimalFontSize = mid;
            low = mid;
        } else {
            high = mid;
        }
    }
    
    while (!checkFontSizeFits(optimalFontSize) && optimalFontSize > minFontSize) {
        optimalFontSize -= 0.01; 
        if (optimalFontSize < minFontSize) {
            optimalFontSize = minFontSize;
            break;
        }
    }
    optimalFontSize = Math.min(optimalFontSize, initialFontSize);

    textObj.set({
        fontSize: optimalFontSize,
        left: realWidth / 2,
        originX: 'center',
        originY: 'top', 
        width: effectiveMaxWidth, 
        lineHeight: fixedLineHeight
    });
    // Top позиция будет установлена updateAllObjectPositions()
}

// --- brailleTranslator (без изменений) ---
function brailleTranslator(text) {
    let brailleMap = {
        'А': 'a', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Д': 'd', 'Е': 'e', 'Ё': 'e',
        'Ж': 'j', 'З': 'z', 'И': 'i', 'Й': 'y', 'К': 'k', 'Л': 'l', 'М': 'm',
        'Н': 'n', 'О': 'o', 'П': 'p', 'Р': 'r', 'С': 's', 'Т': 't', 'У': 'u',
        'Ф': 'f', 'Х': 'h', 'Ц': 'c', 'Ч': 'c',
        'Ш': 's', 'Щ': 's', 
        'Ъ': 'x', 'Ы': 'w', 'Ь': 'j', 
        'Э': 'e', 'Ю': 'u', 'Я': 'r', 
        
        // Цифры (с префиксом # для числового знака)
        '1': '#a', '2': '#b', '3': '#c', '4': '#d', '5': '#e',
        '6': '#f', '7': '#g', '8': '#h', '9': '#i', '0': '#j',
        
        // Пунктуация
        '.': '.', ',': ',', '-': '-', '?': '?', '!': '!', ' ': ' ',
        '\n': '\n' 
    };
    
    let translatedText = '';
    for (let i = 0; i < text.length; i++) {
        let char = text[i].toUpperCase();
        if (brailleMap[char] !== undefined) {
            translatedText += brailleMap[char];
        }
    }
    return translatedText;
}

function updateName() {
    let currentText = $('#name-edit').val();
    let lines = currentText.split('\n');

    if (lines.length > 3) {
        const originalSelectionStart = document.getElementById('name-edit').selectionStart;
        const originalSelectionEnd = document.getElementById('name-edit').selectionEnd;
        
        let newText = lines.slice(0, 3).join('\n');
        $('#name-edit').val(newText);
        
        if (originalSelectionStart > newText.length) {
            document.getElementById('name-edit').selectionStart = document.getElementById('name-edit').selectionEnd = newText.length;
        } else {
            document.getElementById('name-edit').selectionStart = originalSelectionStart;
            document.getElementById('name-edit').selectionEnd = originalSelectionEnd;
        }
    }
    
    if (nameObject && currentText !== undefined) {
        nameObject.set({
            text: currentText.toUpperCase(),
        });
        adjustNameSize(nameObject); 
    }
    // Позиционирование будет выполнено updateAllObjectPositions()
    updateAllObjectPositions(); 
    updateBrailleText(); 
    canvas.renderAll(); 
}

function updateModeOfOperationDetails() {
     const currentText = $('#mode-of-operation-details-edit').val();
     let lines = currentText.split('\n');

    if (lines.length > 3) {
        const originalSelectionStart = document.getElementById('mode-of-operation-details-edit').selectionStart;
        const originalSelectionEnd = document.getElementById('mode-of-operation-details-edit').selectionEnd;
        
        let newText = lines.slice(0, 3).join('\n');
        $(this).val(newText);
        
        if (originalSelectionStart > newText.length) {
            this.selectionStart = this.selectionEnd = newText.length;
        } else {
            this.selectionStart = originalSelectionStart;
            this.selectionEnd = originalSelectionEnd;
        }
    }

    if (modeOfOperationDetailsObject && currentText !== undefined) {
        modeOfOperationDetailsObject.set({
            text: currentText.toUpperCase(),
        });
        adjustModeOfOperationDetailsText(modeOfOperationDetailsObject);
    }
    // Позиционирование будет выполнено updateAllObjectPositions()
    updateAllObjectPositions(); 
    updateBrailleText();
    canvas.renderAll();
}


function updateAddress() {
    let currentText = $('#address-edit').val();
    currentText = currentText.split('\n')[0];
    
    if (addressObject && currentText !== undefined) {
        addressObject.set({
            text: currentText.toUpperCase(),
            lineHeight: 1 
        });
        adjustAddressSize(addressObject); 
    }
    // Позиционирование будет выполнено updateAllObjectPositions()
    updateAllObjectPositions(); 
    updateBrailleText(); 
    canvas.renderAll(); 
}

// --- updateBrailleText (обновлена для удаления внутренних переносов строк) ---
function updateBrailleText() {
    const nameRaw = $('#name-edit').val();
    const addressRaw = $('#address-edit').val();
    const modeDetailsRaw = $('#mode-of-operation-details-edit').val();
    
    let combinedTextForBraille = [];

    const processedName = nameRaw.replace(/\n/g, ' ').trim();
    if (processedName) {
        combinedTextForBraille.push(processedName);
    }

    const processedModeDetails = modeDetailsRaw.replace(/\n/g, ' ').trim();
    if (processedModeDetails) {
        combinedTextForBraille.push(processedModeDetails);
    }

    const processedAddress = addressRaw.trim();
    if (processedAddress) {
        combinedTextForBraille.push(processedAddress);
    }

    const finalCombinedText = combinedTextForBraille.join('\n');

    const brailleTranslated = brailleTranslator(finalCombinedText);

    if (brailleObject && brailleTranslated !== undefined) {
        brailleObject.set({
            text: brailleTranslated.toUpperCase(),
            fontSize: BRAILLE_FIXED_FONT_SIZE, 
            width: realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2, 
            splitByGrapheme: false, 
            breakWords: false,      
            ellipsis: false,        
            lineHeight: 1.35,
            originY: 'top' 
        });
        brailleObject.initDimensions(); // Обновим размеры для updateAllObjectPositions()
        // Позиционирование будет выполнено updateAllObjectPositions()
    }
}

// --- НОВАЯ ГЛАВНАЯ ФУНКЦИЯ ПОЗИЦИОНИРОВАНИЯ: updateAllObjectPositions ---
function updateAllObjectPositions() {
    // Убеждаемся, что все текстовые объекты инициализированы
    if (!nameObject || !modeOfOperationObject || !modeOfOperationDetailsObject || !addressObject || !brailleObject || !horizontalLineObject) {
        return; 
    }

    // Убеждаемся, что все элементы имеют актуальные размеры после их adjust/update
    nameObject.initDimensions();
    modeOfOperationObject.initDimensions();
    modeOfOperationDetailsObject.initDimensions();
    addressObject.initDimensions();
    brailleObject.initDimensions();

    // 1. Вычисляем суммарную высоту всех динамических элементов
    const totalElementsHeight = 
        nameObject.height +
        modeOfOperationObject.height +
        modeOfOperationDetailsObject.height +
        addressObject.height +
        brailleObject.height +
        (Math.min(realWidth, realHeight) * HORIZONTAL_LINE_STROKE_FACTOR); // Толщина линии

    // 2. Вычисляем количество "межэлементных" промежутков
    // Всего 5 текстовых объектов + 1 линия = 6 "элементов" в стеке.
    // Значит, 6 + 1 = 7 равномерных промежутков (1 сверху, 5 между элементами, 1 снизу).
    const numberOfElementsInStack = 6; 
    const totalUniformGaps = numberOfElementsInStack + 1; 

    const uniformGap = (realHeight - totalElementsHeight) / totalUniformGaps;

    let currentY = uniformGap; // Начинаем с верхнего отступа (который равен всем остальным промежуткам)

    // 1. Название организации
    nameObject.set({ top: currentY, originY: 'top', left: realWidth / 2, originX: 'center' });
    currentY += nameObject.height + uniformGap;

    // 2. Заголовок "РЕЖИМ РАБОТЫ"
    modeOfOperationObject.set({ top: currentY, originY: 'top', left: realWidth / 2, originX: 'center' });
    currentY += modeOfOperationObject.height + uniformGap;

    // 3. Детали режима работы
    modeOfOperationDetailsObject.set({ top: currentY, originY: 'top', left: realWidth / 2, originX: 'center' });
    currentY += modeOfOperationDetailsObject.height + uniformGap;

    // 4. Адрес организации
    addressObject.set({ top: currentY, originY: 'top', left: realWidth / 2, originX: 'center' });
    currentY += addressObject.height + uniformGap;

    // 5. Горизонтальная линия
    const lineThickness = Math.min(realWidth, realHeight) * HORIZONTAL_LINE_STROKE_FACTOR;
    const lineCenterY = currentY + (lineThickness / 2); 
    const effectiveLineWidth = (realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2); 
    const lineX1 = (realWidth / 2) - (effectiveLineWidth / 2);
    const lineX2 = (realWidth / 2) + (effectiveLineWidth / 2);
    horizontalLineObject.set({
        x1: lineX1, y1: lineCenterY,
        x2: lineX2, y2: lineCenterY,
        strokeWidth: lineThickness
    });
    currentY += lineThickness + uniformGap; 

    // 6. Текст Брайля
    brailleObject.set({ top: currentY, originY: 'top', left: realWidth / 2, originX: 'center' }); 
}
// --- КОНЕЦ ГЛАВНОЙ ФУНКЦИИ ПОЗИЦИОНИРОВАНИЯ ---


function changeSize() {
    currentSize = $('#size-select').val();
    realWidth = SIZES[currentSize].width;
    realHeight = SIZES[currentSize].height;
    
    canvas.setDimensions({
        width: realWidth,
        height: realHeight
    });
    
    var objectsToRemove = [];
    canvas.getObjects().forEach(obj => {
        if ((obj instanceof fabric.Rect && obj.fill === '#ffec00') || 
            (obj instanceof fabric.Rect && obj.stroke === '#1d1d1b')) {
            objectsToRemove.push(obj);
        }
    });

    objectsToRemove.forEach(obj => {
        canvas.remove(obj);
    });
    
    loadAndPositionBackground(); 
    
    // --- Обновление и позиционирование всех текстовых объектов ---
    // NameObject
    if (nameObject) {
        nameObject.set({
            left: realWidth / 2,
            top: 0, // top будет установлен updateAllObjectPositions
            fontSize: realHeight * NAME_FONT_RATIO,
            width: realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2
        });
        adjustNameSize(nameObject);
    }
    
    // ModeOfOperationObject
    if (modeOfOperationObject) {
        modeOfOperationObject.set('fontSize', realHeight * MODE_OF_OPERATION_FONT_RATIO);
        adjustModeOfOperationText(modeOfOperationObject);
    }

    if (modeOfOperationDetailsObject) {
        modeOfOperationDetailsObject.set('fontSize', realHeight * MODE_OF_OPERATION_DETAILS_FONT_RATIO);
        adjustModeOfOperationDetailsText(modeOfOperationDetailsObject);
    }
    
    if (addressObject) {
        addressObject.set({
            left: realWidth / 2,
            // top будет установлен updateAllObjectPositions
            fontSize: realHeight * ADDRESS_FONT_RATIO,
            noWrap: false,
            splitByGrapheme: true,
            breakWords: true,
            width: realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2 
        });
        adjustAddressSize(addressObject);
    }

    // BrailleObject
    if (brailleObject) {
        brailleObject.set('fontSize', BRAILLE_FIXED_FONT_SIZE); 
        updateBrailleText(); 
    }

    updateAllObjectPositions(); // Централизованное позиционирование
    
    canvas.renderAll(); 
}

// --- Функция для скачивания SVG с текстом в кривых (Fabric.js) ---
function downloadSVG() {
    canvas.bringToFront(nameObject);
    canvas.bringToFront(modeOfOperationObject);
    canvas.bringToFront(modeOfOperationDetailsObject); 
    canvas.bringToFront(addressObject);
    canvas.bringToFront(horizontalLineObject); 
    canvas.bringToFront(brailleObject); 
    canvas.renderAll(); 
    
    const nameOriginalProps = {
        originX: nameObject.originX, originY: nameObject.originY,
        left: nameObject.left, top: nameObject.top
    };
    const modeOfOperationOriginalProps = {
        originX: modeOfOperationObject.originX, originY: modeOfOperationObject.originY,
        left: modeOfOperationObject.left, top: modeOfOperationObject.top,
        width: modeOfOperationObject.width
    };
    const modeOfOperationDetailsOriginalProps = { 
        originX: modeOfOperationDetailsObject.originX, originY: modeOfOperationDetailsObject.originY,
        left: modeOfOperationDetailsObject.left, top: modeOfOperationDetailsObject.top,
        width: modeOfOperationDetailsObject.width
    };
    const addressOriginalProps = {
        originX: addressObject.originX, originY: addressObject.originY,
        left: addressObject.left, top: addressObject.top,
        width: addressObject.width 
    };
    const brailleOriginalProps = {
        originX: brailleObject.originX, originY: brailleObject.originY,
        left: brailleObject.left, top: brailleObject.top,
        width: brailleObject.width
    };
    const horizontalLineOriginalProps = { 
        x1: horizontalLineObject.x1, y1: horizontalLineObject.y1,
        x2: horizontalLineObject.x2, y2: horizontalLineObject.y2,
        strokeWidth: horizontalLineObject.strokeWidth
    };


    nameObject.set({
        originX: 'left', originY: 'top',
        left: nameOriginalProps.left - (nameObject.width * (nameOriginalProps.originX === 'center' ? 0.5 : 0)),
        top: nameOriginalProps.top - (nameObject.height * (nameOriginalProps.originY === 'top' ? 0 : 0)) 
    });

    const effectiveMaxWidthMode = realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2;
    modeOfOperationObject.set({
        originX: 'left', originY: 'top',
        width: effectiveMaxWidthMode,
        left: modeOfOperationOriginalProps.left - (effectiveMaxWidthMode * (modeOfOperationOriginalProps.originX === 'center' ? 0.5 : 0)),
        top: modeOfOperationOriginalProps.top - (modeOfOperationObject.height * (modeOfOperationOriginalProps.originY === 'top' ? 0 : 0))
    });

    const effectiveMaxWidthDetails = realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2;
    modeOfOperationDetailsObject.set({
        originX: 'left', originY: 'top',
        width: effectiveMaxWidthDetails,
        left: modeOfOperationDetailsOriginalProps.left - (effectiveMaxWidthDetails * (modeOfOperationDetailsOriginalProps.originX === 'center' ? 0.5 : 0)),
        top: modeOfOperationDetailsOriginalProps.top - (modeOfOperationDetailsObject.height * (modeOfOperationDetailsOriginalProps.originY === 'top' ? 0 : 0))
    });
    
    const effectiveMaxWidthAddress = realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2;
    addressObject.set({
        originX: 'left', originY: 'top',
        width: effectiveMaxWidthAddress, 
        left: addressOriginalProps.left - (effectiveMaxWidthAddress * (addressOriginalProps.originX === 'center' ? 0.5 : 0)),
        top: addressOriginalProps.top - (addressObject.height * (addressOriginalProps.originY === 'top' ? 0 : 0)) 
    });

    horizontalLineObject.set({
        x1: horizontalLineOriginalProps.x1, y1: horizontalLineOriginalProps.y1,
        x2: horizontalLineOriginalProps.x2, y2: horizontalLineOriginalProps.y2,
    });

    const effectiveMaxWidthBraille = realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2;
    brailleObject.set({
        originX: 'left', originY: 'top', 
        width: effectiveMaxWidthBraille, 
        left: brailleOriginalProps.left - (effectiveMaxWidthBraille * (brailleOriginalProps.originX === 'center' ? 0.5 : 0)),
        top: brailleOriginalProps.top - (brailleObject.height * (brailleOriginalProps.originY === 'top' ? 0 : 0)) 
    });

    canvas.renderAll(); 

    var svg = canvas.toSVG({
        suppressPreamble: true,
        viewBox: {
            x: 0,
            y: 0,
            width: realWidth,
            height: realHeight
        },
        width: (realWidth * 0.4) + 'mm', 
        height: (realHeight * 0.4) + 'mm' 
    });
    
    // Восстанавливаем оригинальные свойства объектов
    nameObject.set(nameOriginalProps);
    modeOfOperationObject.set(modeOfOperationOriginalProps); 
    modeOfOperationDetailsObject.set(modeOfOperationDetailsOriginalProps); 
    addressObject.set(addressOriginalProps);
    horizontalLineObject.set(horizontalLineOriginalProps); 
    brailleObject.set(brailleOriginalProps); 
    canvas.renderAll(); 

    var blob = new Blob([svg], {type: 'image/svg+xml;charset=utf-8'});
    var url = URL.createObjectURL(blob);
    
    const orgName = $('#name-edit').val().toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    var a = document.createElement('a');
    a.href = url;
    a.download = `Табличка ${orgName} (${currentSize.replace('x', '×')} мм).svg`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(function(){
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);

    alert('SVG скачан с текстом в кривых.');
}


$(document).ready(function(){
    document.body.classList.remove('loaded'); 
    var fontLoadPromises = [];

    // --- ЗАГРУЗКА ШРИФТОВ OPENTYPE.JS ---
    fontLoadPromises.push(new Promise((resolve, reject) => {
        opentype.load('/braille/fonts/STIXTwoText-Bold.woff', function(err, font) {
            if (err) {
                console.error('Error loading STIXTwoText-Bold font:', err);
                reject(err);
            } else {
                fontsArr['als-bold'] = { obj: font, name: 'als-bold' }; 
                resolve();
            }
        });
    }));
    fontLoadPromises.push(new Promise((resolve, reject) => {
        opentype.load('/braille/fonts/STIXTwoText-Medium.woff', function(err, font) {
            if (err) {
                console.error('Error loading STIXTwoText-Medium font:', err);
                reject(err);
            } else {
                fontsArr['als-medium'] = { obj: font, name: 'als-medium' }; 
                resolve();
            }
        });
    }));
    fontLoadPromises.push(new Promise((resolve, reject) => {
        opentype.load('/braille/fonts/astakhovbraillealpha.woff', function(err, font) { 
            if (err) {
                console.error('Error loading SimBraille font:', err);
                reject(err);
            } else {
                fontsArr['SimBraille'] = { obj: font, name: 'SimBraille' }; 
                resolve();
            }
        });
    }));


    Promise.all(fontLoadPromises).then(() => {
        console.log('All opentype fonts loaded.');
        
        canvas = new fabric.Canvas('c', { 
            width: realWidth,
            height: realHeight,
            preserveObjectStacking: true,
            selection: false,
            fireRightClick: true,
            stopContextMenu: true,
            allowTouchScrolling: true,
            skipTargetFind: true,
            enableRetinaScaling: true 
        });
        
        document.getElementById('c').addEventListener('touchmove', function(e) {
            if (!canvas.findTarget(e)) {
                e.stopPropagation();
            }
        }, { passive: true });
        
        // Название организации
        nameObject = new fabric.CurvesText('ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ АВТОНОМНОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ ВЫСШЕГО ОБРАЗОВАНИЯ "СЕВЕРНЫЙ (АРКТИЧЕСКИЙ) ФЕДЕРАЛЬНЫЙ УНИВЕРСИТЕТ ИМЕНИ М.В. ЛОМОНОСОВА"', {
            fontFamily: 'als-bold', 
            width: realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2,
            left: realWidth / 2,
            top: 0, 
            originX: 'center',
            originY: 'top',
            textAlign: 'center',
            fill: '#1d1d1b',
            fontSize: realHeight * NAME_FONT_RATIO,
            lineHeight: 1.1, 
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            textBackgroundColor: 'transparent',
            splitByGrapheme: false,
            breakWords: false,      
            ellipsis: true,         
            fontVariant: 'normal',
        });
        
        // Объект для заголовка "РЕЖИМ РАБОТЫ"
        modeOfOperationObject = new fabric.CurvesText('РЕЖИМ РАБОТЫ', {
            fontFamily: 'als-bold', 
            width: realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2,
            left: realWidth / 2,
            top: 0, 
            originX: 'center',
            originY: 'top', 
            textAlign: 'center',
            fill: '#1d1d1b',
            fontSize: realHeight * MODE_OF_OPERATION_FONT_RATIO,
            lineHeight: 1, 
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            textBackgroundColor: 'transparent',
            splitByGrapheme: false, 
            breakWords: false,      
            ellipsis: true, 
            fontVariant: 'normal',
        });

        // Объект для деталей режима работы
        modeOfOperationDetailsObject = new fabric.CurvesText('ПОНЕДЕЛЬНИК-ПЯТНИЦА: 8:30–18:00\nСУББОТА: 8:30–16:00\nВОСКРЕСЕНЬЕ: ВЫХОДНОЙ', {
            fontFamily: 'als-bold',
            width: realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2,
            left: realWidth / 2,
            top: 0, 
            originX: 'center',
            originY: 'top', 
            textAlign: 'center',
            fill: '#1d1d1b',
            fontSize: realHeight * MODE_OF_OPERATION_DETAILS_FONT_RATIO,
            lineHeight: 1.1, 
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            textBackgroundColor: 'transparent',
            splitByGrapheme: false,
            breakWords: false,
            ellipsis: true,
            fontVariant: 'normal',
        });
        
        // Адрес организации
        addressObject = new fabric.CurvesText('163002, Архангельская область, город Архангельск, наб. Северной Двины, д.17', {
            fontFamily: 'als-bold', 
            left: realWidth / 2,
            top: 0, 
            originX: 'center',
            originY: 'top', 
            textAlign: 'center',
            fill: '#1d1d1b',
            fontSize: realHeight * ADDRESS_FONT_RATIO,
            lineHeight: 1, 
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            noWrap: false, 
            splitByGrapheme: true, 
            breakWords: true,    
            width: realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2, 
            textBackgroundColor: 'transparent',
            fontVariant: 'normal',
        });

        // Объект для текста Брайля
        brailleObject = new fabric.CurvesText('БРАЙЛЬ', {
            fontFamily: 'SimBraille', 
            width: realWidth * (1 - 2 * TEXT_PADDING_PERCENT) - 2, 
            left: realWidth / 2,
            top: 0, 
            originX: 'center',
            originY: 'top', 
            textAlign: 'left',
            fill: '#1d1d1b',
            fontSize: BRAILLE_FIXED_FONT_SIZE, 
            lineHeight: 1.35, 
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            textBackgroundColor: 'transparent',
            splitByGrapheme: false, 
            breakWords: false,      
            ellipsis: false,        
            fontVariant: 'normal',
        });
        
        // НОВОЕ: Горизонтальная линия
        horizontalLineObject = new fabric.Line([0, 0, 0, 0], { 
            stroke: HORIZONTAL_LINE_COLOR,
            strokeWidth: Math.min(realWidth, realHeight) * HORIZONTAL_LINE_STROKE_FACTOR,
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true
        });

        canvas.add(nameObject);
        canvas.add(modeOfOperationObject);
        canvas.add(modeOfOperationDetailsObject); 
        canvas.add(addressObject);
        canvas.add(horizontalLineObject); 
        canvas.add(brailleObject); 
        
        $('#name-edit').val(nameObject.text);
        $('#mode-of-operation-details-edit').val(modeOfOperationDetailsObject.text); 
        $('#address-edit').val(addressObject.text.split('\n')[0]); 

        isCanvasInitialized = true;
        loadAndPositionBackground(); 
        
        $(window).resize(updateCanvasScale);
        
        const debouncedCanvasUpdateName = debounce(function() {
            updateName();
        }, 150); 

        const debouncedCanvasUpdateAddress = debounce(function() {
            updateAddress();
        }, 150); 

        const debouncedCanvasUpdateModeDetails = debounce(function() {
            updateModeOfOperationDetails();
        }, 150);


        $('#name-edit').on('input', function() {
            let currentText = $(this).val();
            let lines = currentText.split('\n');

            if (lines.length > 3) {
                const originalSelectionStart = this.selectionStart;
                const originalSelectionEnd = this.selectionEnd;
                
                let newText = lines.slice(0, 3).join('\n');
                $(this).val(newText);
                
                if (originalSelectionStart > newText.length) {
                    this.selectionStart = this.selectionEnd = newText.length;
                } else {
                    this.selectionStart = originalSelectionStart;
                    this.selectionEnd = originalSelectionEnd;
                }
            }

            autoGrowTextarea(this);

            debouncedCanvasUpdateName();
        }).on('keydown', function(event) { 
            if (event.key === 'Enter') {
                let currentText = $(this).val();
                let lines = currentText.split('\n');
                if (lines.length >= 3) {
                    event.preventDefault(); 
                }
            }
        });


        $('#mode-of-operation-details-edit').on('input', function() {
            let currentText = $(this).val();
            let lines = currentText.split('\n');

            if (lines.length > 3) {
                const originalSelectionStart = this.selectionStart;
                const originalSelectionEnd = this.selectionEnd;
                
                let newText = lines.slice(0, 3).join('\n');
                $(this).val(newText);
                
                if (originalSelectionStart > newText.length) {
                    this.selectionStart = this.selectionEnd = newText.length;
                } else {
                    this.selectionStart = originalSelectionStart;
                    this.selectionEnd = originalSelectionEnd;
                }
            }
            autoGrowTextarea(this); 
            debouncedCanvasUpdateModeDetails();
        }).on('keydown', function(event) { 
            if (event.key === 'Enter') {
                let currentText = $(this).val();
                let lines = currentText.split('\n');
                if (lines.length >= 3) {
                    event.preventDefault(); 
                }
            }
        });


$('#address-edit').on('input', function() {
// 1. Гарантируем, что в значении нет переносов строк (например, при вставке)
let currentText = $(this).val();
if (currentText.includes('\n')) {
const originalSelectionStart = this.selectionStart;
currentText = currentText.replace(/\n/g, ''); // Удаляем все переносы
$(this).val(currentText);
// Восстанавливаем позицию курсора для удобства
this.selectionStart = this.selectionEnd = originalSelectionStart > 0 ? originalSelectionStart -1 : 0;
}

// 2. Вызываем функцию для авто-изменения высоты
autoGrowTextarea(this);

// 3. Вызываем обновление холста
debouncedCanvasUpdateAddress();

}).on('keydown', function(event) {
// Блокируем нажатие клавиши Enter
if (event.key === 'Enter') {
event.preventDefault();
}
});


        $('#size-select').on('change', changeSize);
        $('#download-btn').click(downloadSVG);

        autoGrowTextarea(document.getElementById('name-edit'));
        autoGrowTextarea(document.getElementById('mode-of-operation-details-edit')); 
        autoGrowTextarea(document.getElementById('address-edit'));
        
        updateName(); 
        updateAddress();
        updateBrailleText(); 

        clearTimeout(loadTimeout);
        document.body.classList.add('loaded');
        setTimeout(function() {
            var preloader = document.querySelector('.preloader');
            if (preloader) {
                preloader.remove();
            }
        }, 150);

    }).catch(error => {
        console.error("Failed to load Opentype fonts or initialize Fabric.js:", error);
        alert("Ошибка при загрузке шрифтов или инициализации. Проверьте консоль.");
        clearTimeout(loadTimeout);
        document.body.classList.add('loaded');
        setTimeout(function() {
            var preloader = document.querySelector('.preloader');
            if (preloader) {
                preloader.remove();
            }
        }, 150);
    });
});

var loadTimeout = setTimeout(function() {
    var preloaderText = document.querySelector('.preloader__text');
    if (preloaderText) {
        preloaderText.textContent = 'Загрузка занимает больше времени, чем обычно...';
    }
}, 3000);

window.addEventListener('error', function() {
    clearTimeout(loadTimeout);
    document.body.classList.add('loaded');
    setTimeout(function() {
        var preloader = document.querySelector('.preloader');
        if (preloader) {
            preloader.remove();
        }
    }, 100);
}, true);