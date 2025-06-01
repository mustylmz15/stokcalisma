<template>
    <!-- Home -->
    <icon-home v-if="icon === 'home'" v-bind="$attrs" />
    
    <!-- User Icons -->
    <icon-user v-else-if="icon === 'user'" v-bind="$attrs" />
    <icon-users v-else-if="icon === 'users'" v-bind="$attrs" />
    <icon-users-group v-else-if="icon === 'users-group'" v-bind="$attrs" />
    <icon-user-plus v-else-if="icon === 'user-plus'" v-bind="$attrs" />
    
    <!-- Action Icons -->
    <icon-plus v-else-if="icon === 'plus'" v-bind="$attrs" />
    <icon-edit v-else-if="icon === 'edit'" v-bind="$attrs" />
    <icon-trash v-else-if="icon === 'trash'" v-bind="$attrs" />
    <icon-search v-else-if="icon === 'search'" v-bind="$attrs" />
    <icon-refresh v-else-if="icon === 'refresh'" v-bind="$attrs" />
    <icon-save v-else-if="icon === 'save'" v-bind="$attrs" />
    <icon-copy v-else-if="icon === 'copy'" v-bind="$attrs" />
    <icon-download v-else-if="icon === 'download'" v-bind="$attrs" />
    <icon-eye v-else-if="icon === 'eye'" v-bind="$attrs" />
    <icon-settings v-else-if="icon === 'settings'" v-bind="$attrs" />
    
    <!-- Navigation -->
    <icon-arrow-left v-else-if="icon === 'arrow-left'" v-bind="$attrs" />
    <icon-arrow-backward v-else-if="icon === 'arrow-backward'" v-bind="$attrs" />
    <icon-arrow-forward v-else-if="icon === 'arrow-forward'" v-bind="$attrs" />
    <icon-menu v-else-if="icon === 'menu'" v-bind="$attrs" />
    
    <!-- Status -->
    <icon-circle-check v-else-if="icon === 'check'" v-bind="$attrs" />
    <icon-x-circle v-else-if="icon === 'x-circle'" v-bind="$attrs" />
    <icon-x v-else-if="icon === 'times' || icon === 'x'" v-bind="$attrs" />
    <icon-info-circle v-else-if="icon === 'info'" v-bind="$attrs" />
    <icon-help-circle v-else-if="icon === 'help'" v-bind="$attrs" />
    
    <!-- Content -->
    <icon-folder v-else-if="icon === 'folder'" v-bind="$attrs" />
    <icon-file v-else-if="icon === 'file'" v-bind="$attrs" />
    <icon-box v-else-if="icon === 'box' || icon === 'warehouse'" v-bind="$attrs" />
    <icon-layout-grid v-else-if="icon === 'grid'" v-bind="$attrs" />
    <icon-layout v-else-if="icon === 'layout'" v-bind="$attrs" />
    
    <!-- Communication -->
    <icon-mail v-else-if="icon === 'mail'" v-bind="$attrs" />
    <icon-phone v-else-if="icon === 'phone'" v-bind="$attrs" />
    <icon-message v-else-if="icon === 'message'" v-bind="$attrs" />
    <icon-bell v-else-if="icon === 'bell'" v-bind="$attrs" />
    
    <!-- Location -->
    <icon-map-pin v-else-if="icon === 'location' || icon === 'map-pin'" v-bind="$attrs" />
    <icon-globe v-else-if="icon === 'globe'" v-bind="$attrs" />
    
    <!-- Code -->
    <icon-code v-else-if="icon === 'code'" v-bind="$attrs" />
    
    <!-- Media -->
    <icon-play-circle v-else-if="icon === 'play'" v-bind="$attrs" />
    <icon-video v-else-if="icon === 'video'" v-bind="$attrs" />
    <icon-camera v-else-if="icon === 'camera'" v-bind="$attrs" />
    <icon-gallery v-else-if="icon === 'gallery'" v-bind="$attrs" />
    
    <!-- Time -->
    <icon-clock v-else-if="icon === 'clock'" v-bind="$attrs" />
    <icon-calendar v-else-if="icon === 'calendar'" v-bind="$attrs" />
    
    <!-- System -->
    <icon-loader v-else-if="icon === 'loading' || icon === 'loader'" v-bind="$attrs" />
    <icon-desktop v-else-if="icon === 'desktop'" v-bind="$attrs" />
    <icon-laptop v-else-if="icon === 'laptop'" v-bind="$attrs" />
    <icon-server v-else-if="icon === 'server'" v-bind="$attrs" />
    
    <!-- Warehouse Specific Icons -->
    <!-- Using existing icons that match warehouse concepts -->
    <icon-folder-plus v-else-if="icon === 'project'" v-bind="$attrs" />
    <icon-users-group v-else-if="icon === 'user-gear'" v-bind="$attrs" />
    <icon-layout-grid v-else-if="icon === 'hierarchy'" v-bind="$attrs" />
    <icon-folder-minus v-else-if="icon === 'sub-warehouses'" v-bind="$attrs" />
    <icon-circle-check v-else-if="icon === 'pause'" v-bind="$attrs" />
    
    <!-- Fallback -->
    <icon-circle-check v-else v-bind="$attrs" />
</template>

<script setup lang="ts">
// Import all the icon components
import IconHome from './icon-home.vue'
import IconUser from './icon-user.vue'
import IconUsers from './icon-users.vue'
import IconUsersGroup from './icon-users-group.vue'
import IconUserPlus from './icon-user-plus.vue'
import IconPlus from './icon-plus.vue'
import IconEdit from './icon-edit.vue'
import IconTrash from './icon-trash.vue'
import IconSearch from './icon-search.vue'
import IconRefresh from './icon-refresh.vue'
import IconSave from './icon-save.vue'
import IconCopy from './icon-copy.vue'
import IconDownload from './icon-download.vue'
import IconEye from './icon-eye.vue'
import IconSettings from './icon-settings.vue'
import IconArrowLeft from './icon-arrow-left.vue'
import IconArrowBackward from './icon-arrow-backward.vue'
import IconArrowForward from './icon-arrow-forward.vue'
import IconMenu from './icon-menu.vue'
import IconCircleCheck from './icon-circle-check.vue'
import IconXCircle from './icon-x-circle.vue'
import IconX from './icon-x.vue'
import IconInfoCircle from './icon-info-circle.vue'
import IconHelpCircle from './icon-help-circle.vue'
import IconFolder from './icon-folder.vue'
import IconFile from './icon-file.vue'
import IconBox from './icon-box.vue'
import IconLayoutGrid from './icon-layout-grid.vue'
import IconLayout from './icon-layout.vue'
import IconMail from './icon-mail.vue'
import IconPhone from './icon-phone.vue'
import IconMessage from './icon-message.vue'
import IconBell from './icon-bell.vue'
import IconMapPin from './icon-map-pin.vue'
import IconGlobe from './icon-globe.vue'
import IconCode from './icon-code.vue'
import IconPlayCircle from './icon-play-circle.vue'
import IconVideo from './icon-video.vue'
import IconCamera from './icon-camera.vue'
import IconGallery from './icon-gallery.vue'
import IconClock from './icon-clock.vue'
import IconCalendar from './icon-calendar.vue'
import IconLoader from './icon-loader.vue'
import IconDesktop from './icon-desktop.vue'
import IconLaptop from './icon-laptop.vue'
import IconServer from './icon-server.vue'
import IconFolderPlus from './icon-folder-plus.vue'
import IconFolderMinus from './icon-folder-minus.vue'

interface Props {
    icon: string
}

defineProps<Props>()
</script>
