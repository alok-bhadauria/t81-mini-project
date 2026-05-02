import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import * as THREE from "three";

const animationCache = {};

function FBXModel({ url, playing, avatarName }) {
    const groupRef = useRef();
    const mixerRef = useRef();
    const currentActionRef = useRef();
    const isBaseLoaded = useRef(false);
    const { camera } = useThree();

    useEffect(() => {
        let isMounted = true;
        const loader = new FBXLoader();
        loader.load(
            `/animations/sentiments/${avatarName}/${avatarName}_sa001_happy.fbx`,
            (baseFbx) => {
                if (!isMounted || !groupRef.current) return;

                const box = new THREE.Box3().setFromObject(baseFbx);
                const size = new THREE.Vector3();
                const center = new THREE.Vector3();
                box.getSize(size);
                box.getCenter(center);

                const maxDim = Math.max(size.x, size.y, size.z);
                const targetHeight = 2.0;
                const scaleFactor = maxDim > 0 ? targetHeight / maxDim : 0.01;

                baseFbx.scale.setScalar(scaleFactor);
                baseFbx.position.set(-center.x * scaleFactor, -center.y * scaleFactor, -center.z * scaleFactor);

                const scaledHeight = size.y * scaleFactor;
                baseFbx.position.y = -scaledHeight / 2;

                baseFbx.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                groupRef.current.add(baseFbx);
                mixerRef.current = new THREE.AnimationMixer(baseFbx);
                isBaseLoaded.current = true;

                const fov = camera.fov * (Math.PI / 180);
                const cameraZ = scaledHeight / (2 * Math.tan(fov / 2)) + 1;
                camera.position.set(0, 0, Math.max(cameraZ, 3));
                camera.lookAt(0, 0, 0);
                camera.updateProjectionMatrix();

                if (url) {
                    loadAndPlayAnimation(url);
                }
            },
            undefined,
            (err) => {
                if (isMounted) console.error("FBX Base load error:", avatarName, err);
            }
        );

        return () => {
            isMounted = false;
            if (groupRef.current) {
                while (groupRef.current.children.length) {
                    groupRef.current.remove(groupRef.current.children[0]);
                }
            }
            if (mixerRef.current) {
                mixerRef.current.stopAllAction();
                mixerRef.current = null;
            }
            isBaseLoaded.current = false;
            currentActionRef.current = null;
        };
    }, [avatarName]);

    const loadAndPlayAnimation = (animUrl) => {
        if (!animUrl || !mixerRef.current) return;

        const playClip = (clip) => {
            if (currentActionRef.current) {
                const newAction = mixerRef.current.clipAction(clip);
                newAction.setLoop(THREE.LoopOnce, 1);
                newAction.clampWhenFinished = true;
                newAction.reset();
                newAction.play();
                if (playing) {
                    currentActionRef.current.crossFadeTo(newAction, 0.2, true);
                } else {
                    currentActionRef.current.stop();
                }
                currentActionRef.current = newAction;
            } else {
                const action = mixerRef.current.clipAction(clip);
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
                if (playing) {
                    action.reset();
                    action.play();
                }
                currentActionRef.current = action;
            }
        };

        if (animationCache[animUrl]) {
            playClip(animationCache[animUrl]);
        } else {
            const loader = new FBXLoader();
            loader.load(
                animUrl,
                (fbx) => {
                    if (fbx.animations && fbx.animations.length > 0) {
                        const clip = fbx.animations[0];
                        animationCache[animUrl] = clip;
                        if (animUrl === url) {
                            playClip(clip);
                        }
                    }
                },
                undefined,
                (err) => console.error("FBX Anim load error:", err)
            );
        }
    };

    useEffect(() => {
        if (isBaseLoaded.current) {
            loadAndPlayAnimation(url);
        }
    }, [url]);

    useEffect(() => {
        if (!currentActionRef.current) return;
        if (playing) {
            currentActionRef.current.paused = false;
        } else {
            currentActionRef.current.paused = true;
        }
    }, [playing]);

    useFrame((_, delta) => {
        if (mixerRef.current) {
            mixerRef.current.update(delta);
        }
    });

    return <group ref={groupRef} />;
}

function SceneContent({ animationUrl, playing, avatarName }) {
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
            <pointLight position={[-5, 5, -5]} intensity={0.4} color="#aaaaff" />
            <Environment preset="city" />
            <OrbitControls
                enablePan={false}
                minDistance={1}
                maxDistance={10}
                target={[0, 0, 0]}
            />
            <Suspense fallback={null}>
                <FBXModel url={animationUrl} playing={playing} avatarName={avatarName} />
            </Suspense>
        </>
    );
}

export function AvatarRenderer({ animationUrl, playing, avatarName = "AJ" }) {
    return (
        <Canvas
            shadows
            camera={{ position: [0, 0, 5], fov: 45 }}
            style={{ width: "100%", height: "100%" }}
        >
            <SceneContent animationUrl={animationUrl} playing={playing} avatarName={avatarName} />
        </Canvas>
    );
}
