#include <iostream>
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstring>
#include <thread>
#include <chrono>

// Safe Research: Cooperative Debug IPC (Shared Memory Telemetry)
// This is a self-contained demo that creates a POSIX shared memory segment,
// writes mock player data into it, and then another thread reads it.
// It does NOT read external process memory or use process_vm_readv.

struct PlayerTelemetry {
    float x, y, z;
    int health;
    int ammo;
    bool isAlive;
};

void writer_thread(const char* shm_name) {
    int fd = shm_open(shm_name, O_CREAT | O_RDWR, 0666);
    ftruncate(fd, sizeof(PlayerTelemetry));
    PlayerTelemetry* data = (PlayerTelemetry*)mmap(0, sizeof(PlayerTelemetry), PROT_WRITE, MAP_SHARED, fd, 0);
    
    float pos = 0.0f;
    for (int i = 0; i < 5; i++) {
        data->x = pos;
        data->y = pos + 10.0f;
        data->z = 100.0f;
        data->health = 100 - (i * 10);
        data->ammo = 30 - i;
        data->isAlive = data->health > 0;
        
        std::cout << "[Writer] Updated telemetry: Health=" << data->health << " PosX=" << data->x << "\n";
        pos += 5.0f;
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }
    
    munmap(data, sizeof(PlayerTelemetry));
    close(fd);
}

void reader_thread(const char* shm_name) {
    std::this_thread::sleep_for(std::chrono::milliseconds(500)); // Wait for writer to init
    
    int fd = shm_open(shm_name, O_RDONLY, 0666);
    if (fd == -1) {
        std::cerr << "[Reader] Failed to open shared memory\n";
        return;
    }
    
    PlayerTelemetry* data = (PlayerTelemetry*)mmap(0, sizeof(PlayerTelemetry), PROT_READ, MAP_SHARED, fd, 0);
    
    for (int i = 0; i < 5; i++) {
        std::cout << "[Reader] Read telemetry: Health=" << data->health << " PosX=" << data->x << " Alive=" << (data->isAlive ? "Yes" : "No") << "\n";
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }
    
    munmap(data, sizeof(PlayerTelemetry));
    close(fd);
    shm_unlink(shm_name);
}

int main() {
    std::cout << "--- Cooperative Debug IPC Demo ---\n";
    const char* shm_name = "/openmod_telemetry_demo";
    
    std::thread writer(writer_thread, shm_name);
    std::thread reader(reader_thread, shm_name);
    
    writer.join();
    reader.join();
    
    std::cout << "--- Demo Finished ---\n";
    return 0;
}
