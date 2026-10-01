project(LuxandFaceSDK)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME LuxandFaceSDK)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

# Define C++ library and add all sources
add_library(${PACKAGE_NAME} SHARED
        src/main/cpp/cpp-adapter.cpp
        ../cpp/LuxandFaceSDKHybrid.cpp
)

# Add Nitrogen specs :)
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/LuxandFaceSDK+autolinking.cmake)

# Set up local includes
include_directories("src/main/cpp" "../cpp")

add_library(fsdk SHARED IMPORTED)
set_target_properties(fsdk PROPERTIES
        IMPORTED_LOCATION ${CMAKE_SOURCE_DIR}/src/main/jniLibs/${ANDROID_ABI}/libfsdk.so
        IMPORTED_NO_SONAME TRUE
)

find_library(LOG_LIB log)

# Link all libraries together
target_link_libraries(
        ${PACKAGE_NAME}
        fsdk    # <-- Luxand FaceSDK
        ${LOG_LIB}
        android # <-- Android core
)
