<template>
    <!--腾讯地图插件-->
    <mapView v-if="isShow" :markersArr="markerArr" :myLcat="myLocation"  @chooseMarker="getChooseMarker" @moveMapView="getMapCenterLoca"></mapView>
</template>
<script setup>
    import { nextTick, onMounted, ref } from 'vue';
	import config from '@/request/config.js'
    import mapView from '@/components/my-map/my-map.vue'
    const markerArr = ref([]);//标记点，可动态获取
    const isShow = ref(false);//
    const myLocation = ref({});//用户发送到后台请求对应的数据
    onMounted(()=>{
        getMapMarkersList();
        nextTick(()=>{
            isShow.value = true;
        })
        getMyLocation();
    });
    //获取地图移动的中心坐标
    const getMapCenterLoca = (e)=>{
    };
    //获取选中的标记
    const getChooseMarker = (e) =>{
    };
    //获取当前所在的位置
    const getMyLocation =()=>{
        //获得当前的位置
        if (typeof wx === 'undefined' || !wx.getFuzzyLocation) {
            return;
        }
        wx.getFuzzyLocation({
            type: 'gcj02', //返回国测局坐标
            success(e) {
                myLocation.value = e;
            },
            fail(e) {
            }
        })
    }
    //获取位置中心范围内的数据
    const getMapMarkersList = () =>{
    markerArr.value =    [
            {
                id:1,
                longitude:'115.851002', //经度
                latitude:'28.689684',//纬度
                iconPath:'/static/ad/ad01.jpg',//缩略图
                width:40,
                height: 40,
                title:'商家1',
                address:'商家标记地址1',
                alpha: 1,   //透明度
                callout: {  //自定义标记点上方的气泡窗口 点击有效
                    content: '商家标记点1',//文本
                    color: '#ffffff',//文字颜色
                    fontSize: 12,//文本大小
                    borderRadius: 5,//边框圆角
                    padding:7,
                    bgColor: '#3f94fd',//背景颜色
                    display: 'ALWAYS',//常显
                },
            },
            {
                id:2,
                longitude:'115.880356',
                latitude:'28.643896',
                iconPath:'/static/ad/ad02.jpg',
                width:40,
                height: 40,
                title:'商家2',
                address:'商家标记地址2',
                alpha: 1,
                callout: {  //气泡窗口
                    content:'商家标记点2',
                    color: '#ffffff',
                    fontSize: 12,
                    borderRadius: 5,
                    padding:7,
                    bgColor: '#3f94fd',
                    display: 'ALWAYS',
                },
            },
            {
                id:3,
                longitude:'115.902672',
                latitude:'28.671311',
                iconPath:'/static/ad/ad03.jpg',
                width:40,
                height: 40,
                title:'商家3',
                address:'商家标记地址3',
                alpha: 1,
                callout: {  //气泡窗口
                    content: '商家标记点3',
                    color: '#ffffff',
                    fontSize: 12,
                    borderRadius: 5,
                    padding:7,
                    bgColor: '#3f94fd',
                    display: 'ALWAYS',
                },
            },
            {
                id:4,
                longitude:'115.881386',
                latitude:'28.682456',
                iconPath:'/static/ad/ad02.jpg',
                width:40,
                height: 40,
                title:'商家4',
                address:'商家标记地址4',
                alpha: 1,
                callout: {  //气泡窗口
                    content: '商家标记点4',
                    color: '#ffffff',
                    fontSize: 12,
                    borderRadius: 5,
                    padding:7,
                    bgColor: '#3f94fd',
                    display: 'ALWAYS',
                },
            },
            {
                id:5,
                longitude:'115.854435',
                latitude:'28.677787',
                iconPath:'/static/ad/ad01.jpg',
                width:40,
                height: 40,
                title:'商家5',
                address:'商家标记地址5',
                alpha: 1,
                callout: {  //气泡窗口
                    content: '商家标记点5',
                    color: '#ffffff',
                    fontSize: 12,
                    borderRadius: 5,
                    padding:7,
                    bgColor: '#3f94fd',
                    display: 'ALWAYS',
                },
            },
            {
                id:6,
                longitude:'115.848255',
                latitude:'28.660617',
                iconPath:'/static/ad/ad02.jpg',
                width:40,
                height: 40,
                title:'商家6',
                address:'商家标记地址6',
                alpha: 1,
                callout: {  //气泡窗口
                    content: '商家标记点6',
                    color: '#ffffff',
                    fontSize: 12,
                    borderRadius: 5,
                    padding:7,
                    bgColor: '#3f94fd',
                    display: 'ALWAYS',
                },
            },
            {
                id:7,
                longitude:'115.849972',
                latitude:'28.670407',
                iconPath:'/static/ad/ad03.jpg',
                width:40,
                height: 40,
                title:'商家7',
                address:'商家标记地址7',
                alpha: 1,
                callout: {  //气泡窗口
                    content: '商家标记点7',
                    color: '#ffffff',
                    fontSize: 12,
                    borderRadius: 5,
                    padding:7,
                    bgColor: '#3f94fd',
                    display: 'ALWAYS',
                },
            },
            {
                id:8,
                longitude:'115.900612',
                latitude:'28.661671',
                iconPath:'/static/ad/ad01.jpg',
                width:40,
                height: 40,
                title:'商家8',
                address:'商家标记地址8',
                alpha: 1,
                callout: {  //气泡窗口
                    content: '商家标记点8',
                    color: '#ffffff',
                    fontSize: 12,
                    borderRadius: 5,
                    padding:7,
                    bgColor: '#3f94fd',
                    display: 'ALWAYS',
                },
            },
        ];
    }
</script>
<style>
</style>
