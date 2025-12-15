module.exports = {
    default: {
        requireModule: ['ts-node/register'],
        require: ['src/steps/*.ts', 'src/support/*.ts'],
        format: ['progress-bar', 'html:cucumber-report.html'],
        paths: ['features/*.feature'],
    }
}
