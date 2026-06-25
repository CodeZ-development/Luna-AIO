const chalk = require("chalk");
const moment = require("moment");

const theme = {
    time:    chalk.hex("#7c3aed"),
    info:    chalk.hex("#a78bfa"),
    success: chalk.hex("#34d399"),
    warn:    chalk.hex("#fbbf24"),
    error:   chalk.hex("#f87171"),
    debug:   chalk.hex("#67e8f9"),
    icons: {
        info:    ">",
        success: "+",
        warn:    "!",
        error:   "x",
        debug:   "~",
        cmd:     "#",
        update:  "*",
        shard:   "@",
    },
};

module.exports = class Logger {
    static timestamp() {
        return theme.time(moment().format("HH:mm:ss"));
    }

    static line(icon, color, content) {
        console.log(`${this.timestamp()} ${color(icon)} ${color(content)}`);
    }

    static info(content)    { this.line(theme.icons.info,    theme.info,    content); }
    static success(content) { this.line(theme.icons.success, theme.success, content); }
    static warn(content)    { this.line(theme.icons.warn,    theme.warn,    content); }
    static error(content)   { this.line(theme.icons.error,   theme.error,   content); }
    static debug(content)   { this.line(theme.icons.debug,   theme.debug,   content); }
    static update(content)  { this.line(theme.icons.update,  theme.info,    content); }
    static cmd(content)     { this.line(theme.icons.cmd,     theme.info,    content); }
    static shard(content)   { this.line(theme.icons.shard,   theme.info,    content); }
    static log(content)     { this.info(content); }
    static ready(content)   { this.success(content); }
};
