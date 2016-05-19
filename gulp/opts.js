import { default as minimist } from 'minimist'
export default minimist(process.argv.slice(2), {
    boolean: [
        'p', // production build?
    ],
    default: {
        p: false,
    }
});
