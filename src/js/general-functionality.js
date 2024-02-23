

/** @type {Object<boolean>} */
let keyStates = {};
/** @type {Object} */
let keybinds = null;
/** @type {Array<Object<function>>} */
let _keybindMappings = [];

let languages;

document.addEventListener('DOMContentLoaded', async () => {
    // Set the theme to the user's preference
    document.documentElement.dataset['theme'] = localStorage.theme || 'dark'

    // Register an event listener with an associated callback function
    window.on || (window.on = function(/** @type string */event, /** @type function*/ callback) {
        if (typeof callback !== 'function')
            throw new TypeError('Callback must be a function');
        window.eventQueue || (window.eventQueue = {})               // Create queue object if it doesn't exist
        window.eventQueue[event] || (window.eventQueue[event] = []) // Create associated array in queue
        window.eventQueue[event].push(callback)                     // Add callback to queue
    })

    // Ensure that the emit function is registered
    window.emit || (window.emit = function(/** @type string */event, /** @type any */...args) {
        if (window.eventQueue && window.eventQueue[event])          // If the event queue exists and the event has listeners
            window.eventQueue[event].forEach(callback => callback(...args))  // call them.
    })

    // If the file icon map hasn't been loaded yet and the html
    // element has the load-icons attribute, load the file_icons.json file
    if (typeof window.iconMap === 'undefined' && document.documentElement.dataset.hasOwnProperty('loadIcons'))
    {
        window['iconMap'] = await window.config.get('file_icons');
    }
    keybinds = await window.config.get('keybinds')
    languages = await window.config.get('languages');
    languages = languages[localStorage.language || (localStorage.language = 'english')] || languages['english']
    if (!languages)
        throw new Error('No languages found')

    // Load languages onto the page
    loadPageLanguages();
})

/**
 * Function for getting the icon of a file based on its extension
 * @param {string} extension The extension of the file
 * @returns {string} The path to the icon
 */
window.getIcon = function(extension) {
    if (!window.iconMap)
        return '';
    extension = extension.toLowerCase().replace(/(\s+)/g, '')
    return '../resources/file_icons/' +
        (window.iconMap.find(icon =>
                icon.id === extension || icon.extensions.includes(extension)) || window.iconMap.find(icon => icon.id === 'unknown')
        )['resource']
}

/**
 * Function for loading the languages from the languages.json file
 * and updating them onto the current page.
 */
function loadPageLanguages()
{
    // Go through all elements with 'data-lang', 'data-lang-title', 'data-lang-value', or 'data-lang-placeholder' attribute
    // and replace their properties with the corresponding language from the languages file
    document.querySelectorAll('*:is([data-lang], [data-lang-title], [data-lang-value], [data-lang-placeholder])')
        .forEach(element => {
            [['lang', 'innerText'], ['langTitle', 'title'], ['langValue', 'value'], ['langPlaceholder', 'placeholder']]
                .forEach(([data, attribute]) => {
                    // Check if the dataset attribute is present
                    if (element.dataset[data])
                        element[attribute] = languages[element.dataset[data]] || element.dataset[data];
                })
        })
}

// Register keydown event to update keybind states
document.addEventListener('keydown', (event) => {
    keyStates[event.key.toLowerCase()] = true
    checkKeybinds(event);
})

// Register keyup event to update keybind states
document.addEventListener('keyup', (e) => {
    keyStates[e.key.toLowerCase()] = false
})

/**
 * Check if a keybind is pressed and call the associated function
 */
function checkKeybinds(event) {

    if (document.documentElement.dataset.hasOwnProperty('keybind')
        && keybinds.hasOwnProperty(document.documentElement.dataset.keybind))
    {
        checkSpecificKeybinds(document.documentElement.dataset.keybind, event)
    }
    if (keybinds.hasOwnProperty('global'))
    {
        checkSpecificKeybinds('global', event)
    }
    else throw new Error('No keybinds found for the current context')
}

/**
 * Function for checking a specific map of keybinds.
 * When all keys are pressed in the provided keybind map, the associated function is called
 * @param {string} keybindIdentifier The identifier of the keybind map to check.
 * @param {KeyboardEvent} event The fired press event
 */
function checkSpecificKeybinds(keybindIdentifier, event) {
    if (!keybinds[keybindIdentifier])
        return
    Object.entries(keybinds[keybindIdentifier])
        .forEach(([keybind, value]) => {
        if (!value['combination']) // If there is no combination property, continue
            return

        // Combinations are separated by '|' in the keybinds.json file
        let combinations = value['combination'].split('|')
        for (let combination of combinations)
        {
            let keys = combination.split('+')
            if (keys.length === 0 || combination.trim().length === 0) // skip empty combinations
                continue

            // Check if all keys are pressed. If so, find the associated function and call it
            if (keys.every(key => isKeyPressed(key)))
            {
                for (let keybindMapping of _keybindMappings)
                {
                    if (keybindMapping.hasOwnProperty(keybind) && typeof keybindMapping[keybind] === 'function')
                    {
                        window.logger.log('Keybind pressed: ' + keybind)
                        keybindMapping[keybind]()
                        keyStates = {} // Reset the key states
                        event.preventDefault()
                        event.stopImmediatePropagation()
                    }
                }
            }
        }
    })
}

/**
 * Function for registering a set of keybind mappings.
 * Provided argument must be an object with keys of which the values are functions.
 * These functions will be called when the keybind combination, defined in 'keybinds.json'
 * are pressed. The keys in the provided object must match the one in the keybinds file.
 * @param {Object<function>} keybinds
 */
function registerKeybindMappings(keybinds) {

    _keybindMappings.push(keybinds)
}

/**
 * Function for checking if a key is pressed
 * @param {string} key The key to check
 * @returns {boolean} Whether the key is pressed
 */
function isKeyPressed(key) {
    return keyStates[key.toLowerCase()] || false
}