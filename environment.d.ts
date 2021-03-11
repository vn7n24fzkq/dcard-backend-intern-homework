declare global {
    namespace NodeJS {
        interface ProcessEnv {
            RATE_STRATEGY:
                | 'fixed-window'
                | 'sliding-window'
                | 'punishment-fixed-window';
        }
    }
}
// If this file has no import/export statements (i.e. is a script)  // convert it into a module by adding an empty export statement.
export {};
