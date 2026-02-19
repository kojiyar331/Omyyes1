const moment = require("moment-timezone");
const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } = require("fs-extra");
const { join, resolve } = require("path");
const { execSync } = require('child_process');
const logger = require("./utils/log.js");
const login = require("fca-priyansh"); 
const axios = require("axios");
const listPackage = JSON.parse(readFileSync('./package.json')).dependencies;
const listbuiltinModules = require("module").builtinModules;

// ==================== 🔥 ARIF BABU BOT - MAIN SYSTEM 🔥 ====================

console.log("\n" + "=".repeat(50));
console.log("🤖 ARIF BABU BOT - STARTING SYSTEM 🤖");
console.log("=".repeat(50) + "\n");

/* ========================== GLOBAL OBJECTS INITIALIZATION ========================== */

global.client = {
    commands: new Map(),
    events: new Map(),
    cooldowns: new Map(),
    eventRegistered: [],
    handleSchedule: [],
    handleReaction: [],
    handleReply: [],
    mainPath: process.cwd(),
    configPath: "",
    api: null,
    timeStart: null,

    getTime: function(option) {
        const formats = {
            seconds: "ss",
            minutes: "mm", 
            hours: "HH",
            date: "DD",
            month: "MM",
            year: "YYYY",
            fullHour: "HH:mm:ss",
            fullYear: "DD/MM/YYYY",
            fullTime: "HH:mm:ss DD/MM/YYYY"
        };
        return moment.tz("Asia/Kolkata").format(formats[option] || "HH:mm:ss");
    }
};

global.data = {
    threadInfo: new Map(),
    threadData: new Map(),
    userName: new Map(),
    userBanned: new Map(),
    threadBanned: new Map(),
    commandBanned: new Map(),
    threadAllowNSFW: [],
    allUserID: [],
    allCurrenciesID: [],
    allThreadID: []
};

global.utils = require("./utils");
global.nodemodule = {};
global.config = {};
global.configModule = {};
global.moduleData = [];
global.language = {};

/* ========================== CONFIGURATION LOADING ========================== */

console.log("📁 Loading configuration...");

try {
    global.client.configPath = join(global.client.mainPath, "config.json");
    const configValue = require(global.client.configPath);

    for (const key in configValue) {
        global.config[key] = configValue[key];
    }

    logger.loader("✅ Config loaded successfully!");
} catch (error) {
    logger.loader("❌ config.json not found!", "error");
    process.exit(1);
}

// Save temp config
writeFileSync(global.client.configPath + ".temp", JSON.stringify(global.config, null, 4), 'utf8');

/* ========================== DATABASE CONNECTION ========================== */

const { Sequelize, sequelize } = require("./includes/database");

/* ========================== LANGUAGE SYSTEM ========================== */

try {
    const langFile = readFileSync(`${__dirname}/languages/${global.config.language || "en"}.lang`, 'utf-8').split(/\r?\n|\r/);
    const langData = langFile.filter(item => !item.startsWith('#') && item.trim() !== '');

    for (const item of langData) {
        const separatorIndex = item.indexOf('=');
        if (separatorIndex === -1) continue;

        const itemKey = item.slice(0, separatorIndex);
        const itemValue = item.slice(separatorIndex + 1);
        const dotIndex = itemKey.indexOf('.');

        if (dotIndex === -1) continue;

        const head = itemKey.slice(0, dotIndex);
        const key = itemKey.slice(dotIndex + 1);

        if (!global.language[head]) global.language[head] = {};
        global.language[head][key] = itemValue.replace(/\\n/g, '\n');
    }

    logger.loader("✅ Language loaded: " + (global.config.language || "en"));
} catch (error) {
    logger.loader("⚠️ Language file not found, using defaults", "warn");
}

global.getText = function(...args) {
    if (!global.language[args[0]] || !global.language[args[0]][args[1]]) {
        return args[1] || "Text not found";
    }

    let text = global.language[args[0]][args[1]];
    for (let i = 2; i < args.length; i++) {
        text = text.replace(new RegExp(`%${i-1}`, 'g'), args[i]);
    }
    return text;
};

/* ========================== APPSTATE LOADING ========================== */

let appState;
try {
    const appStatePath = resolve(join(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"));
    appState = require(appStatePath);
    logger.loader("✅ Appstate loaded successfully!");
} catch (error) {
    logger.loader("❌ Appstate not found!", "error");
    process.exit(1);
}

/* ========================== COMMAND LOADER FUNCTION ========================== */

function loadCommands(api) {
    console.log("\n📂 Loading commands...");

    const commandPath = join(global.client.mainPath, 'models/commands');
    const commandFiles = readdirSync(commandPath).filter(file => 
        file.endsWith('.js') && 
        !file.includes('example') && 
        !global.config.commandDisabled?.includes(file)
    );

    let loadedCount = 0;
    let failedCount = 0;

    for (const file of commandFiles) {
        try {
            const module = require(join(commandPath, file));

            // Validate module structure
            if (!module.config || !module.run) {
                throw new Error("Invalid module structure");
            }

            // Check for duplicate command names
            if (global.client.commands.has(module.config.name)) {
                throw new Error(`Command name "${module.config.name}" already exists`);
            }

            // Handle dependencies
            if (module.config.dependencies) {
                installDependencies(module.config.dependencies, module.config.name);
            }

            // Handle environment config
            if (module.config.envConfig) {
                if (!global.configModule[module.config.name]) {
                    global.configModule[module.config.name] = {};
                }

                for (const [key, value] of Object.entries(module.config.envConfig)) {
                    global.configModule[module.config.name][key] = 
                        global.config[module.config.name]?.[key] || value;
                }
            }

            // Run onLoad function if exists
            if (module.onLoad) {
                module.onLoad({ api, models: null });
            }

            // Register event handlers
            if (module.handleEvent) {
                global.client.eventRegistered.push(module.config.name);
            }

            // Save command
            global.client.commands.set(module.config.name, module);
            loadedCount++;

        } catch (error) {
            logger.loader(`❌ Failed to load ${file}: ${error.message}`, "error");
            failedCount++;
        }
    }

    logger.loader(`✅ Loaded ${loadedCount} commands | ❌ Failed ${failedCount} commands`);
    return { loadedCount, failedCount };
}

/* ========================== EVENT LOADER FUNCTION ========================== */

function loadEvents(api) {
    console.log("\n📂 Loading events...");

    const eventPath = join(global.client.mainPath, 'models/events');
    const eventFiles = readdirSync(eventPath).filter(file => 
        file.endsWith('.js') && 
        !global.config.eventDisabled?.includes(file)
    );

    let loadedCount = 0;
    let failedCount = 0;

    for (const file of eventFiles) {
        try {
            const event = require(join(eventPath, file));

            // Validate event structure
            if (!event.config || !event.run) {
                throw new Error("Invalid event structure");
            }

            // Check for duplicate event names
            if (global.client.events.has(event.config.name)) {
                throw new Error(`Event name "${event.config.name}" already exists`);
            }

            // Handle dependencies
            if (event.config.dependencies) {
                installDependencies(event.config.dependencies, event.config.name);
            }

            // Handle environment config
            if (event.config.envConfig) {
                if (!global.configModule[event.config.name]) {
                    global.configModule[event.config.name] = {};
                }

                for (const [key, value] of Object.entries(event.config.envConfig)) {
                    global.configModule[event.config.name][key] = 
                        global.config[event.config.name]?.[key] || value;
                }
            }

            // Run onLoad function if exists
            if (event.onLoad) {
                event.onLoad({ api, models: null });
            }

            // Save event
            global.client.events.set(event.config.name, event);
            loadedCount++;

        } catch (error) {
            logger.loader(`❌ Failed to load ${file}: ${error.message}`, "error");
            failedCount++;
        }
    }

    logger.loader(`✅ Loaded ${loadedCount} events | ❌ Failed ${failedCount} events`);
    return { loadedCount, failedCount };
}

/* ========================== DEPENDENCY INSTALLER ========================== */

function installDependencies(dependencies, moduleName) {
    for (const [dep, version] of Object.entries(dependencies)) {
        try {
            if (!global.nodemodule[dep]) {
                if (listPackage[dep] || listbuiltinModules.includes(dep)) {
                    global.nodemodule[dep] = require(dep);
                } else {
                    const depPath = join(__dirname, 'nodemodules', 'node_modules', dep);

                    try {
                        global.nodemodule[dep] = require(depPath);
                    } catch {
                        logger.loader(`📦 Installing ${dep} for ${moduleName}...`, "warn");

                        const versionTag = (version && version !== '*') ? `@${version}` : '';
                        execSync(`npm install ${dep}${versionTag} --no-package-lock --no-save`, {
                            stdio: 'ignore',
                            cwd: join(__dirname, 'nodemodules')
                        });

                        // Clear cache and try again
                        delete require.cache[require.resolve(depPath)];
                        global.nodemodule[dep] = require(depPath);
                    }
                }
            }
        } catch (error) {
            logger.loader(`⚠️ Failed to install ${dep} for ${moduleName}`, "warn");
        }
    }
}

/* ========================== BOT INITIALIZATION ========================== */

async function initializeBot({ models }) {
    console.log("\n" + "=".repeat(50));
    console.log("🤖 LOGGING INTO FACEBOOK... 🤖");
    console.log("=".repeat(50) + "\n");

    login({ appState }, async (err, api) => {
        if (err) {
            logger.loader("❌ Login failed! Check your appstate.json", "error");
            console.error(err);
            process.exit(1);
        }

        // Set API options
        api.setOptions(global.config.FCAOption || {});

        // Save new appstate
        writeFileSync(
            join(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"),
            JSON.stringify(api.getAppState(), null, 2)
        );

        // Set global variables
        global.client.api = api;
        global.client.timeStart = Date.now();
        global.config.version = '2.0.0';

        console.log("\n" + "=".repeat(50));
        console.log("✅ LOGIN SUCCESSFUL! ✅");
        console.log("=".repeat(50) + "\n");

        // Load commands and events
        const commands = loadCommands(api);
        const events = loadEvents(api);

        // Summary
        console.log("\n" + "=".repeat(50));
        console.log("📊 BOT STARTUP SUMMARY 📊");
        console.log("=".repeat(50));
        console.log(`⏰ Time: ${moment.tz("Asia/Kolkata").format("HH:mm:ss DD/MM/YYYY")}`);
        console.log(`📦 Commands: ${commands.loadedCount} loaded, ${commands.failedCount} failed`);
        console.log(`📦 Events: ${events.loadedCount} loaded, ${events.failedCount} failed`);
        console.log(`⚡ Startup Time: ${((Date.now() - global.client.timeStart) / 1000).toFixed(2)}s`);
        console.log("=".repeat(50) + "\n");

        // Remove temp file
        try {
            unlinkSync(global.client.configPath + '.temp');
        } catch (e) {}

        // Initialize listener
        const listener = require('./includes/listen')({ api, models });

        // Start listening
        global.handleListen = api.listenMqtt((error, message) => {
            if (error) {
                logger.loader(`❌ Listener error: ${JSON.stringify(error)}`, "error");
                return;
            }

            // Ignore certain message types
            if (['presence', 'typ', 'read_receipt'].includes(message.type)) {
                return;
            }

            // Debug mode
            if (global.config.DeveloperMode) {
                console.log(message);
            }

            return listener(message);
        });

        logger.loader("✅ Bot is now running! 🚀");
        console.log("\n" + "=".repeat(50));
        console.log("🎯 ARIF BABU BOT IS ONLINE! 🎯");
        console.log("=".repeat(50) + "\n");
    });
}

/* ========================== DATABASE CONNECTION ========================== */

(async () => {
    try {
        await sequelize.authenticate();
        logger.loader("✅ Database connected successfully!");

        const models = require('./includes/database/model')({ Sequelize, sequelize });
        await initializeBot({ models });

    } catch (error) {
        logger.loader(`❌ Database connection failed: ${error.message}`, "error");
        process.exit(1);
    }
})();

/* ========================== ERROR HANDLERS ========================== */

process.on('unhandledRejection', (error) => {
    if (global.config.DeveloperMode) {
        console.error('Unhandled Rejection:', error);
    }
});

process.on('uncaughtException', (error) => {
    if (global.config.DeveloperMode) {
        console.error('Uncaught Exception:', error);
    }
});

process.on('SIGINT', () => {
    console.log("\n\n👋 Shutting down ARIF BABU BOT...");
    if (global.handleListen) {
        global.handleListen.stopListening();
    }
    process.exit(0);
});

// ==================== END OF MAIN FILE ====================