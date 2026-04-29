import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAnimations, OrbitControls, Environment } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import * as THREE from "three";

function FBXModel({ url, onLoaded, playing }) {
    const groupRef = useRef();
    const mixerRef = useRef();
    const actionRef = useRef();

    useEffect(() => {
        if (!url) return;

        const loader = new FBXLoader();
        loader.load(
            url,
            (fbx) => {
                fbx.scale.setScalar(0.01);
                fbx.position.set(0, -1, 0);

                fbx.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.material) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x8888cc,
                                roughness: 0.4,
                                metalness: 0.1,
                            });
                        }
                    }
                });

                while (groupRef.current.children.length) {
                    groupRef.current.remove(groupRef.current.children[0]);
                }
                groupRef.current.add(fbx);

                if (fbx.animations && fbx.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(fbx);
                    const action = mixer.clipAction(fbx.animations[0]);
                    action.setLoop(THREE.LoopOnce, 1);
                    action.clampWhenFinished = true;
                    mixerRef.current = mixer;
                    actionRef.current = action;

                    if (playing) {
                        action.reset();
                        action.play();
                    }
                }

                if (onLoaded) onLoaded();
            },
            undefined,
            (err) => {
                console.error("FBX load error:", err);
            }
        );
    }, [url]);

    useEffect(() => {
        if (!actionRef.current) return;
        if (playing) {
            actionRef.current.reset();
            actionRef.current.play();
        } else {
            actionRef.current.stop();
        }
    }, [playing]);

    useFrame((_, delta) => {
        if (mixerRef.current) {
            mixerRef.current.update(delta);
        }
    });

    return <group ref={groupRef} />;
}

function SceneContent({ animationUrl, playing }) {
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
            <pointLight position={[-5, 5, -5]} intensity={0.4} color="#aaaaff" />
            <Environment preset="city" />
            <OrbitControls
                enablePan={false}
                minDistance={2}
                maxDistance={8}
                target={[0, 0, 0]}
            />
            {animationUrl && (
                <Suspense fallback={null}>
                    <FBXModel url={animationUrl} playing={playing} />
                </Suspense>
            )}
        </>
    );
}

export function AvatarRenderer({ animationUrl, playing }) {
    return (
        <Canvas
            shadows
            camera={{ position: [0, 1, 4], fov: 50 }}
            style={{ width: "100%", height: "100%" }}
        >
            <SceneContent animationUrl={animationUrl} playing={playing} />
        </Canvas>
    );
}
