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
    box-shadow: 0 5px 20px 0 rgba(0,0,0,var(--vs-shadow-opacity,.05))
    border-radius: 12px
    transition: all .25s ease
    position: relative
    padding: 6px 8px
    overflow: hidden
    &:not(.hoverable)
        box-shadow: 0 0px 0px 1px rgba(0,0,0,.05)
    &.borderless
        box-shadow: none
        background: transparent
        padding: 4px 0px
    &.padding
        padding: 12px 16px
    &.hoverable
        cursor: pointer

        &>i
            transform: translateY(20%)
        &:hover
            box-shadow: 0 10px 20px 0 rgba(0,0,0,var(--vs-shadow-opacity,.05))
            transform: translate(0, -5px)
            &>i
                opacity: .4
                transform: none
        &:active
            box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, var(--vs-shadow-opacity,0))
            transform: translate(0, 5px)
    p
        margin: 0
        opacity: 0.8
        font-size: 0.85rem
        &+p
            margin-top: 8px
    &>i
        position: absolute
        bottom: 0
        right: .1em
        font-size: 48px
        opacity: .2
        transition: all .25s ease
        margin: auto
        transform-origin: bottom right
</style>