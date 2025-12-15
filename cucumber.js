const common = {
    requireModule: ['ts-node/register'],
    require: ['src/steps/*.ts', 'src/support/*.ts'],
};

module.exports = {
    default: {
        ...common,
        format: ['progress-bar', 'html:cucumber-report.html'],
        paths: ['features/*.feature'],
    },
    shard: {
        ...common,
    }
}
