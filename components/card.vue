<template>
	<div class="card">
		<slot />
	</div>
</template>
<style lang="sass">
.card
    background: #fff
    background: rgba(var(--vs-background),1)
    color: #2c3e50
    color: rgba(var(--vs-text),1)
    width: 100%
    box-shadow: 0 5px 20px 0 rgba(0,0,0,.05)
    box-shadow: 0 5px 20px 0 rgba(0,0,0,var(--vs-shadow-opacity))
    border-radius: 12px
    transition: all .25s ease
    position: relative
    padding: 8px 12px
    &:not(.hoverable)
        box-shadow: 0 0px 0px 1px rgba(0,0,0,.05)
    &.hoverable
        cursor: pointer
        &:hover
            box-shadow: 0px 0px 0px 0px rgba(0,0,0,0)
            box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, var(--vs-shadow-opacity))
            transform: translate(0, 5px)
            opacity: .7
        &:active
            opacity: 1
    p
        margin: 0
        opacity: 0.8
        font-size: 0.85rem
</style> 