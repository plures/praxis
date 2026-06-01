fn main() {
    // Only run napi_build when the feature is active
    #[cfg(feature = "napi-binding")]
    napi_build::setup();
}
